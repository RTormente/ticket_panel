export default class ShortcutManager {
    constructor(shortcuts = {}, onShortcutsChange = null) {
        this.shortcuts = this._clone(shortcuts || {});
        this.onShortcutsChange = onShortcutsChange;
    }

    _clone(value) {
        return structuredClone(value);
    }

    setShortcuts(shortcuts) {
        this.shortcuts = this._clone(shortcuts || {});
    }

    getShortcutEntries() {
        return Object.entries(this.shortcuts).map(([action, shortcut]) => ({
            action,
            ...structuredClone(shortcut),
        }));
    }

    findActionByKey(keyCode) {
        return Object.entries(this.shortcuts).find(([, shortcut]) => shortcut.key === keyCode)?.[0] ?? null;
    }

    updateShortcut(action, newShortcut) {
        if (!this.shortcuts[action]) {
            return false;
        }

        this.shortcuts = {
            ...this.shortcuts,
            [action]: {
                ...this._clone(this.shortcuts[action]),
                ...this._clone(newShortcut),
            },
        };

        if (typeof this.onShortcutsChange === "function") {
            this.onShortcutsChange(this._clone(this.shortcuts));
        }

        return true;
    }

    render(ui) {
        ui.renderShortcuts(this.getShortcutEntries());
    }
}
