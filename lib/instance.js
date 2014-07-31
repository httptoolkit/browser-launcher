var EventEmitter = require( 'events' ).EventEmitter,
	basename = require( 'path' ).basename,
	child = require( 'child_process' ),
	util = require( 'util' );

function Instance( options ) {
	var that = this;

	EventEmitter.call( this );

	this.command = options.command;
	this.args = options.args;
	this.image = options.image;
	this.processName = options.processName;

	this.process = child.spawn( this.command, this.args, {
		env: options.env,
		cwd: options.cwd
	} );

	this.pid = this.process.pid;
	this.stdout = this.process.stdout;
	this.stderr = this.process.stderr;

	this.process.on( 'exit', function( code, signal ) {
		that.emit( 'stop', code, signal );
	} );
}

util.inherits( Instance, EventEmitter );

Instance.prototype.stop = function( callback ) {
	var that = this;

	if ( typeof callback == 'function' ) {
		this.once( 'stop', callback );
	}

	if ( process.platform === 'win32' ) {
		child.exec( 'taskkill /IM ' + ( this.image || basename( this.command ) ) )
			.on( 'exit', function( code, signal ) {
				that.emit( 'stop', code, signal );
			} );
	} else if ( this.command === 'open' ) {
		child.exec( 'osascript -e \'tell application "' + this.processName + '" to quit\'' );
	} else {
		this.process.kill();
	}
};

module.exports = Instance;
