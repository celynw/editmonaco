# editmonaco

A really powerful and intuitive beets plugin to edit metadata.
Based on the monaco editor (think VSCode), it allows for extensive features such as multiple cursors, and runs in the web browser.

Launching the plugin should be identical to the [`edit` plugin](https://beets.readthedocs.io/en/latest/plugins/edit.html), with a simple change of the plugin name.
For example:

```bash
beet editmonaco Coldplay
```

> [!NOTE]
> For now, it only works when this directory is the working directory

> [!NOTE]
> If running from WSL, set the environment variable to the path to your browser for it to open the page automatically!

This will open the page in your web browser with the current values (it doesn't access the internet).
Edit to your heart's content, and when you're done, press <kbd>Submit</kbd>


## Development

### Standalone

Run `beetsplug/editmonaco.py` directly, it will start with some dummy data.

### beets

Add the path to this repository to your beets config (typically `~/.config/beets/config.yaml`). For instance:

```yaml
pluginpath:
  - ~/PATH/editmonaco/beetsplug
```

> [!NOTE]
> You may need to temporarily remove other plugins from the `plugins` list if you're having trouble with dedicated python environments.

### bun

From the [bun documentation](https://bun.sh/docs/install/lockfile):

```bash
git config diff.lockb.textconv bun
git config diff.lockb.binary true
```

### browser-sync

For development, after running the `beet` command (so that the websocket and server is running), run the following command to enable refreshes when changing the code:

```bash
npx browser-sync start --proxy "localhost:8337" --files metadata.js --port 8338 --ui-port 8339
```

### Program flow

WIP

- 󰌠 `EditMonacoPlugin`
  - `._edit_command()` [with `args`]
  - `.edit()` [with `fields: dict`]
  - `.edit_objects()` [with `fields: dict`]
    - Create temporary file containing `fields` as JSON
    - Start HTTP server in thread (`.serve_http()`)
    - Start websocket server with asyncio (`.serve_websocket()`)
    - Remove temporary file
  - `.save_changes()`
- Require monaco editor
  - Open websocket
  - On event:
    - Create editor column for each field
    - Populate editors
    - Keep lines synchronised
