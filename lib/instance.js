var EventEmitter = require( 'events' ).EventEmitter,
	child = require( 'child_process' ),
	rimraf = require( 'rimraf' ),
	util = require( 'util' );

function Instance( options ) {
	EventEmitter.call( this );

	this.command = options.command;
	this.args = options.args;
	this.image = options.image;
	this.processName = options.processName;
	this.tempDir = options.tempDir;

	this.process = child.spawn( this.command, this.args, {
		env: options.env,
		cwd: options.cwd
	} );

	this.pid = this.process.pid;
	this.stdout = this.process.stdout;
	this.stderr = this.process.stderr;

	// on Windows Opera uses a launcher which is stopped immediately after opening the browser
	// so it makes no sense to bind a listener, though we won't be noticed about crashes...
	if ( options.name === 'opera' && process.platform === 'win32' ) {
		return;
	}

	this.process.on( 'exit', this.emit.bind( this, 'stop' ) );
	if (this.tempDir) {
		this.on( 'stop', function() {
			rimraf( this.tempDir, function() { /* .. */ } );
		}.bind( this ));
	}
}

util.inherits( Instance, EventEmitter );

Instance.prototype.stop = function( callback ) {
	if ( typeof callback == 'function' ) {
		this.once( 'stop', callback );
	}

	// Opera case - it uses a launcher so we have to kill it somehow without a reference to the process
	if ( process.platform === 'win32' && this.image ) {
		child.exec( 'taskkill /F /IM ' + this.image )
			.on( 'exit', this.emit.bind( this, 'stop' ) );
		// OSX case with "open" command
	} else if ( this.command === 'open' ) {
		child.exec( 'osascript -e \'tell application "' + this.processName + '" to quit\'' );
		// every other scenario
	} else {
		this.process.kill();
	}
};

module.exports = Instance;
