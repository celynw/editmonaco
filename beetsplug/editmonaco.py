#!/usr/bin/env python3
"""Open metadata information in a web-based text editor to let the user edit it."""

from __future__ import annotations

import asyncio
import http.server
import json
import logging
import threading
import webbrowser
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import TYPE_CHECKING

import aiofiles
import pandas as pd
import websockets
from beets import ui
from beets.dbcore import types
from beets.importer import action
from beets.library import Item, Library
from beets.plugins import BeetsPlugin
from beets.ui import Subcommand
from beets.ui.commands import PromptChoice, _do_query

if TYPE_CHECKING:
	import optparse
	from typing import Any

	from beets.importer import ImportTask
	from beets.library import Album
	from beets.ui.commands import TerminalImportSession

# These "safe" types can avoid the format/parse cycle that most fields go through;
# They are safe to edit with native JSON types
SAFE_TYPES = (types.BaseFloat, types.BaseInteger, types.Boolean)


def _safe_value(obj: Item | Album, key: str, value: Any) -> bool:  # noqa: ANN401
	"""Check if `value` is safe to represent in JSON, and if it returns to the same type from edited JSON."""
	typ = obj._type(key)  # noqa: SLF001

	return isinstance(typ, SAFE_TYPES) and isinstance(value, typ.model_type)


def flatten(obj: Item | Album, fields: list[str]) -> dict[str, Any]:
	"""
	Represent `obj`, a `dbcore.Model` object, as a dictionary for serialization.

	Only include the given `fields` if provided; otherwise, include everything.
	The resulting dictionary's keys are strings and the values are safely JSON-serializable types.
	"""
	# Format each value
	d = {}
	for key in obj:
		value = obj[key]
		if _safe_value(obj, key, value):
			# A safe value that is faithfully representable in JSON
			d[key] = value
		else:
			# A value that should be edited as a string
			d[key] = obj.formatted()[key]

	# Possibly filter field names
	if fields:
		return {k: d[k] for k in fields if k in d}

	return d


def apply_(obj: Item | Album, data: dict[str, Any]) -> None:
	"""
	Set the fields of a `dbcore.Model` object according to a dictionary.

	This is the opposite of `flatten`.
	The `data` dictionary should have strings as values.
	"""
	for key, value in data.items():
		if _safe_value(obj, key, value):
			# A safe value *stayed* represented as a safe type, so assign it directly
			obj[key] = value
		else:
			# Either the field was stringified originally, or the user changed it from a safe type to an unsafe one
			# Parse it as a string
			obj.set_parse(key, str(value))


class EditMonacoPlugin(BeetsPlugin):
	"""Open metadata information in a web-based text editor to let the user edit it."""

	http_port: int = 8888
	websocket_port: int = 8889
	http_server: http.server.HTTPServer
	tempfile: Path
	fields: list[str]
	success: bool

	def __init__(self) -> None:
		super().__init__()
		self.success = False
		self.config.add(
			{
				# The default fields to edit
				"albumfields": "album albumartist",
				"itemfields": "track title artist album",
				# Silently ignore any changes to these fields
				"ignore_fields": "path",
			},
		)
		self.register_listener(
			"before_choose_candidate",
			self.before_choose_candidate_listener,
		)

	def commands(self) -> list[Subcommand]:
		command = Subcommand("editmonaco", help="Edit medatata in monaco editors")
		command.func = self._edit_command
		command.parser.add_option(
			"-f",
			"--field",
			metavar="FIELD",
			action="append",
			help="edit this field also",
		)
		command.parser.add_option(
			"--all",
			action="store_true",
			dest="all",
			help="edit all fields",
		)
		command.parser.add_album_option()

		return [command]

	def _edit_command(self, lib: Library, opts: optparse.Values, args: list[str]) -> None:
		"""Edit metadata, as main function from the `beet editmonaco` CLI command."""
		# Get the objects to edit
		query = ui.decargs(args)
		items, albums = _do_query(lib, query, opts.album, also_items=False)
		objs = albums if opts.album else items
		if not objs:
			ui.print_("Nothing to edit.")
			return

		# Get the fields to edit
		fields = self._get_fields(album=opts.album, extra=opts.field) if not opts.all else []
		self.edit(opts.album, objs, fields)

	async def serve_websocket(self) -> None:
		self.websocket_server = await websockets.serve(
			self.handler,
			"",
			self.websocket_port,
		)
		logging.info("Serving websocket on port %s", self.websocket_port)
		await self.websocket_server.wait_closed()

	def serve_http(self) -> None:
		handler = http.server.SimpleHTTPRequestHandler
		server_ready = threading.Event()

		def _server_thread() -> None:
			nonlocal server_ready
			with http.server.HTTPServer(("", self.http_port), handler) as self.http_server:
				server_ready.set()
				logging.info("Serving HTTP on port %s", self.http_port)
				self.http_server.serve_forever()

		self.server_thread = threading.Thread(target=_server_thread)
		self.server_thread.daemon = True
		self.server_thread.start()
		server_ready.wait()
		webbrowser.open(f"http://localhost:{self.http_port}")

	async def handler(self, websocket: websockets.server.WebSocketServerProtocol) -> None:
		try:
			while True:
				message = await websocket.recv()
				logging.debug(message)
				try:
					# Normal operation, this is what is returned when editing is done
					data = json.loads(message)
				except json.JSONDecodeError:
					# Other messages
					if message == "Socket connected":
						await self.populate_websocket(websocket)
				except Exception as e:
					print(f"Message: {message}")  # All error messages
					print(e)
				else:
					self.success = True
					self.new_data = pd.DataFrame(data)

					# TODO Enforce types, we should know them?
					# TODO Get editors to match syntax/restrictions, then parse with that knowledge?
					for column in self.old_data.columns:
						try:
							self.new_data[column] = self.new_data[column].astype(self.old_data[column].dtype)
						except ValueError:
							# Handle the case where conversion is not possible
							# This could be due to invalid data formats, etc.
							# You might want to log this or handle it as per your requirements
							print(f"Warning: Could not convert column {column} to {self.old_data[column].dtype}")

					print("Returning data processed")
					break
		except websockets.exceptions.ConnectionClosedOK:
			logging.info("Websocket closed! Page probably closed.")
		finally:
			self.http_server.shutdown()
			self.websocket_server.close()

	async def populate_websocket(self, websocket: websockets.server.WebSocketServerProtocol) -> None:
		"""
		Populate the websocket with the data from the temporary file.

		Parameters
		----------
		websocket
			The websocket to populate
		"""
		# Read data from temporary file
		async with aiofiles.open(self.tempfile.name) as f:
			data = await f.read()

		await websocket.send(data)

		# # Loop until we have parseable data and the user confirms
		# try:
		#     while True:
		#         # Ask the user to edit the data
		#         edit(new.name, self._log)

		#         # Read the data back after editing and check whether anything changed
		#         with codecs.open(new.name, encoding="utf-8") as f:
		#             new_str = f.read()
		#         if new_str == old_str:
		#             ui.print_("No changes; aborting.")
		#             return False

		#         # Parse the updated data
		#         try:
		#             new_data = load(new_str)
		#         except ParseError as e:
		#             ui.print_(f"Could not read data: {e}")
		#             if ui.input_yn("Edit again to fix? (Y/n)", True):
		#                 continue
		#             else:
		#                 return False

		#         # Show the changes
		#         # If the objects are not on the DB yet, we need a copy of their original state for show_model_changes
		#         objs_old = [obj.copy() if obj.id < 0 else None for obj in objs]
		#         self.apply_data(objs, old_data, new_data)
		#         changed = False
		#         for obj, obj_old in zip(objs, objs_old):
		#             changed |= ui.show_model_changes(obj, obj_old)
		#         if not changed:
		#             ui.print_("No changes to apply.")
		#             return False

		#         # Confirm the changes
		#         choice = ui.input_options(
		#             ("continue Editing", "apply", "cancel"),
		#         )
		#         if choice == "a":  # Apply
		#             return True
		#         elif choice == "c":  # Cancel
		#             return False
		#         elif choice == "e":  # Keep editing
		#             # Reset the temporary changes to the objects
		#             # If we have a copy from above, use that, else reload from the database
		#             objs = [
		#                 (old_obj or obj) for old_obj, obj in zip(objs_old, objs)
		#             ]
		#             for obj in objs:
		#                 if not obj.id < 0:
		#                     obj.load()
		#             continue

	def _get_fields(self, *, album: bool, extra: list[optparse.Values]) -> list[str]:
		"""Get the set of fields to edit. Uses a dictionary rather than a set to preserve order."""
		# Start with the configured base fields
		fields = self.config["albumfields"].as_str_seq() if album else self.config["itemfields"].as_str_seq()

		# Add any requested extra fields
		if extra:
			fields += extra

		# Ensure we always have the `id` field for identification
		fields.append("id")

		return list(dict.fromkeys(fields))

	def edit(self, _album: bool | None, objs: list[Item] | list[Album], fields: list[str]) -> list[Item] | list[Album]:
		"""
		Edit the metadata, as the core editor function.

		Parameters
		----------
		_album
			A flag indicating whether we're editing Items or Albums
		objs
			The items/albums to edit
		fields
			The set of field names to edit (or None to edit everything)
		"""
		success = self.edit_objects(objs, fields)

		if any(obj._db is None for obj in objs):  # In case of __main__, we have no database
			return objs

		# Save the new data
		if success:
			self.save_changes(objs)

		return objs

	def edit_objects(self, objs: list[Item] | list[Album], fields: list[str]) -> bool:
		"""
		Dump a set of items/albums to a file as text, ask the user to edit it, and apply any changes to the objects.

		Parameters
		----------
		objs
			The items/albums to edit
		fields
			The set of field names to edit (or None to edit everything)

		Returns
		-------
			Whether the edit succeeded
		"""
		# Set up a temporary file with the initial data for editing
		self.tempfile = NamedTemporaryFile(
			mode="w",
			suffix=".json",
			delete=False,
			encoding="utf-8",
		)
		# Save data to temporary file
		# First, turn Items into pandas dataframe
		self.old_data = pd.DataFrame([flatten(obj, fields) for obj in objs])
		self.old_data.to_json(path_or_buf=self.tempfile.name, orient="records")
		# NEW: Start servers and send the metadata
		self._log.info("Starting HTTP server")
		self.server_http_thread = threading.Thread(target=self.serve_http, daemon=True)
		self.server_http_thread.start()

		self._log.info("Starting websocket server")
		asyncio.run(self.serve_websocket())

		if self.success:
			if self.old_data.equals(self.new_data):
				ui.print_("No changes to apply")
				return False
			self.apply_data(objs)

		Path(self.tempfile.name).unlink()  # Remove the temporary file

		return self.success

	def apply_data(self, objs: list[Item] | list[Album]) -> None:
		"""
		Take potentially-updated data and apply it to a set of Model objects.

		The objects are not written back to the database, so the changes are temporary.
		"""
		if len(self.old_data) != len(self.new_data):
			self._log.warning("Number of objects changed from %d to %d", len(self.old_data), len(self.new_data))

		obj_by_id = {o.id: o for o in objs}
		ignore_fields = self.config["ignore_fields"].as_str_seq()
		# TODO overhaul this
		for old_dict, new_dict in zip(self.old_data.to_dict("records"), self.new_data.to_dict("records")):
			# Prohibit any changes to forbidden fields to avoid clobbering `id` and such by mistake
			forbidden = False
			for key in ignore_fields:
				if old_dict.get(key) != new_dict.get(key):
					self._log.warning("Ignoring object whose %s changed", key)
					forbidden = True
					break
			if forbidden:
				continue

			id_ = int(old_dict["id"])
			apply_(obj_by_id[id_], new_dict)

	def save_changes(self, objs: list[Item] | list[Album]) -> None:
		"""Save a list of updated Model objects to the database."""
		# Save to the database and possibly write tags
		for ob in objs:
			if ob._dirty:  # noqa: SLF001
				logging.debug("Saving changes to %s", ob)
				ob.try_sync(ui.should_write(), ui.should_move())

	def before_choose_candidate_listener(self, _session: TerminalImportSession, task: ImportTask) -> list[PromptChoice]:
		"""Append "Edit" and "edit Candidates" (if applicable) choices to the interactive importer prompt."""
		choices = [PromptChoice("d", "eDit", self.importer_edit_callback)]
		if task.candidates:
			choices.append(
				PromptChoice(
					"c",
					"edit Candidates",
					self.importer_edit_candidate_callback,
				),
			)

		return choices

	def importer_edit_callback(self, _session: TerminalImportSession, task: ImportTask) -> action | None:
		"""Invoke the functionality during an interactive import session on the *original* item tags."""
		# Assign negative temporary ids to Items that are not in the database yet
		# By using negative values, no clash with items in the database can occur
		for i, obj in enumerate(task.items, start=1):
			# The importer may set the id to None when re-importing albums
			if not obj._db or obj.id is None:  # noqa: SLF001
				obj.id = -i

		# Present the JSON to the user and let them change it
		fields = self._get_fields(album=False, extra=[])
		success = self.edit_objects(task.items, fields)

		# Remove temporary ids
		for obj in task.items:
			if obj.id < 0:
				obj.id = None

		# Save the new data
		if success:
			# The importer writes the tags to the files if needed without re-applying metadata
			return action.RETAG
		# Edit cancelled / no edits made and revert changes
		for obj in task.items:
			obj.read()

		return None

	def importer_edit_candidate_callback(self, session: TerminalImportSession, task: ImportTask) -> action | None:
		"""
		Invoke the functionality during an interactive import session on a *candidate*.

		The candidate's metadata is applied to the original items.
		"""
		# Prompt the user for a candidate
		sel = ui.input_options([], numrange=(1, len(task.candidates)))
		# Force applying the candidate on the items
		task.match = task.candidates[sel - 1]
		task.apply_metadata()

		return self.importer_edit_callback(session, task)


if __name__ == "__main__":
	from rich import print

	logging.basicConfig(level=logging.DEBUG)  # Is 'warning' by default
	plugin = EditMonacoPlugin()
	data = [
		Item(id=1000, track=1, title="title1", artist="artist1", format="mp3"),
		Item(id=1001, track=2, title="title2", artist="artist2", format="aac"),
	]
	fields = ["id", "format", "track", "title", "artist", "format"]
	data_original = pd.DataFrame([flatten(obj, fields) for obj in data])

	plugin.edit(_album=False, objs=data, fields=fields)
	data_modified = pd.DataFrame([flatten(obj, fields) for obj in data])

	print("Original:\n", data_original)
	print("Modified:\n", data_modified)
	print("Differences:\n", data_original.compare(data_modified))
