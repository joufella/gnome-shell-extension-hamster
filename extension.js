/* 
 * Simple Hamster extension for gnome-shell
 * (c) 2011 Jerome Oufella <jerome@oufella.com>
 * This project is released under the GNU GPL License.
 * See COPYING for details.
 *
 */
const Lang = imports.lang;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Util = imports.misc.util;
const Gettext = imports.gettext;
const _ = Gettext.gettext;

/* We use keybindings provided by default in the metacity GConf tree, and which
 * are supported by default.
 * Most probably not the smartest choice, time will tell.
 */
const _hamsterKeyBinding = 'run_command_12';

function HamsterPopupMenuEntry() {
	this._init.apply(this, arguments);
}

HamsterPopupMenuEntry.prototype = {
	__proto__: PopupMenu.PopupBaseMenuItem.prototype,

	_init: function(itemParams, entryParams) {
		PopupMenu.PopupBaseMenuItem.prototype._init.call(this, itemParams);
		this._textEntry = new St.Entry(entryParams);
		this._textEntry.clutter_text.connect('activate', Lang.bind(this, this._onEntryActivated));
		this.addActor(this._textEntry);

 		/* Install global keybinding to log something */
		let shellwm = global.window_manager;
		shellwm.takeover_keybinding(_hamsterKeyBinding);
		shellwm.connect('keybinding::' + _hamsterKeyBinding,
			Lang.bind(this, this._onGlobalKeyBinding));
	},

	_onEntryActivated: function() {
		let text = this._textEntry.get_text();
		let cmdline = 'hamster-cli start "' + text + '"';
		try {
			Util.trySpawnCommandLine(cmdline);
		} catch (e) {
			global.log('_onEntryActivated: got exception: ' + e);
		}
		this.emit('activate');
		this._textEntry.set_text('');
		this.close(true);
	},

	_onGlobalKeyBinding: function() {
		global.log('** _onGlobalKeyBinding() triggered');
		/* TODO: do something when global keybinding is pressed. */
	}
};

function HamsterButton() {
	this._init();
}

HamsterButton.prototype = {
	__proto__: PanelMenu.Button.prototype,

	_init: function() {
		PanelMenu.Button.prototype._init.call(this, 0.0);

		/* Create panel item */
		let logo = new St.Icon({
			icon_type: St.IconType.FULLCOLOR,
			icon_size: Main.panel.button.height - 4,
			icon_name: 'hamster-applet'
		});
		let logoBox = new St.BoxLayout();
		logoBox.add_actor(logo);
		this.actor.set_child(logoBox);

		/* Create all items in the dropdown menu: */
		let item;

		/* This one make the hamster applet appear */
		item = new PopupMenu.PopupMenuItem(_("Show Hamster"));
		item.connect('activate', function() {
			let app = Shell.AppSystem.get_default().get_app(
				'hamster-time-tracker.desktop');
			app.activate(-1);
		});
		this.menu.addMenuItem(item);

		/* To stop tracking the current activity */
		item = new PopupMenu.PopupMenuItem(_("Stop tracking"));
		item.connect('activate', function() {
			let cmdline = 'hamster-cli stop';
			try {
				Util.trySpawnCommandLine(cmdline);
			} catch (e) {
				global.log('StopTracking got exception: ' + e);
			}
		});
		this.menu.addMenuItem(item);

		/* The activity item has a text entry field to quickly log something */
		item = new HamsterPopupMenuEntry({ reactive: false }, {
			name: 'searchEntry',
			can_focus: true,
			track_hover: false,
			hint_text: _("Enter activity...")
		});
		this.menu.addMenuItem(item);

		/* Integrate previously defined menu to panel */
		Main.panel._rightBox.insert_actor(this.actor, 0);
		Main.panel._menus.addMenu(this.menu);
	}
};

function main(extensionMeta) {
	/* Localization stuff */
	let userExtensionLocalePath = extensionMeta.path + '/locale';
	Gettext.bindtextdomain("hamster_button", userExtensionLocalePath);
	Gettext.textdomain("hamster_button");

	/* Create our button */
	new HamsterButton();
}
//vim:ts=4
