/* 
 * Simple Hamster extension for gnome-shell
 * Copyright (c) 2011 Jerome Oufella <jerome@oufella.com>
 * Portions originate from the gnome-shell source code, Copyright (c) 
 * its respectives authors.
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

/* What appears next to the hamster icon when no activity is tracked */
const _idleText = '-';

/* We use keybindings provided by default in the metacity GConf tree, and which
 * are supported by default.
 * Most probably not the smartest choice, time will tell.
 */
const _hamsterKeyBinding = 'run_command_12';

/*
 * HamsterPopupMenuEntry defines the text entry field that appears in the
 * Hamster popup menu to quickly enter a new activity. 
 */
function HamsterPopupMenuEntry() {
	this._init.apply(this, arguments);
}

HamsterPopupMenuEntry.prototype = {
	__proto__: PopupMenu.PopupBaseMenuItem.prototype,

	_init: function(itemParams, entryParams) {
		PopupMenu.PopupBaseMenuItem.prototype._init.call(this, itemParams);
		this._textEntry = new St.Entry(entryParams);
		this._textEntry.clutter_text.connect('activate',
			Lang.bind(this, this._onEntryActivated));
		this.addActor(this._textEntry);
	},

	_onEntryActivated: function() {
		this.emit('activate');
		this._textEntry.set_text('');
	}
};


/*
 * HamsterButton defines the item that appears in the right section of the
 * panel and contains the hamster popup menu.
 */
function HamsterButton() {
	this._init();
}

HamsterButton.prototype = {
	__proto__: PanelMenu.Button.prototype,

	_init: function() {
		PanelMenu.Button.prototype._init.call(this, 0.0);
		let box = new St.BoxLayout({ name: 'hamsterMenu' });
		this.actor.set_child(box);

		/* Create panel item (hamster icon + current activity name) */
		this._hamsterIcon = new St.Icon({
			icon_name: 'hamster-applet',
			icon_type: St.IconType.FULLCOLOR,
			style_class: 'popup-menu-icon'
		});

		let idleText = ' ' + _idleText;
		this._activityLabel = new St.Label({ text: idleText });

		this._iconBox = new St.Bin();
		this._iconBox.set_child(this._hamsterIcon);

		box.add(this._iconBox, { y_align: St.Align.MIDDLE, y_fill: false });
		box.add(this._activityLabel, { y_align: St.Align.MIDDLE,
			y_fill: false });

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
		item.connect('activate', Lang.bind(this, this._onStopTracking));
		this.menu.addMenuItem(item);

		/* The activity item has a text entry field to quickly log something */
		item = new HamsterPopupMenuEntry({ reactive: false }, {
			name: 'searchEntry',
			can_focus: true,
			track_hover: false,
			hint_text: _("Enter activity...")
		});
		item.connect('activate', Lang.bind(this, this._onActivityEntry));
		this._activityEntry = item;
		this.menu.addMenuItem(item);

		/* Integrate previously defined menu to panel */
		Main.panel._rightBox.insert_actor(this.actor, 0);
		Main.panel._menus.addMenu(this.menu);

 		/* Install global keybinding to log something */
		let shellwm = global.window_manager;
		shellwm.takeover_keybinding(_hamsterKeyBinding);
		shellwm.connect('keybinding::' + _hamsterKeyBinding,
			Lang.bind(this, this._onGlobalKeyBinding));
	},

	_onStopTracking: function() {
		let cmdline = 'hamster-cli stop';
		try {
			Util.trySpawnCommandLine(cmdline);
			this._activityLabel.set_text(' ' + _idleText);
		} catch (e) {
			global.log('StopTracking got exception: ' + e);
		}
	},

	_onActivityEntry: function() {
		let text = this._activityEntry._textEntry.get_text();
		let cmdline = 'hamster-cli start "' + text + '"';
		try {
			Util.trySpawnCommandLine(cmdline);
			this._activityLabel.set_text(' ' + text);
		} catch (e) {
			global.log('_onActivityEntry(): got exception: ' + e);
		}
	},

	_onGlobalKeyBinding: function() {
		this.menu.toggle();
		this._activityEntry._textEntry.grab_key_focus();
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
