var EventEmitter = require( 'events' ).EventEmitter,
	basename = require( 'path' ).basename,
	spawn = require( 'child_process' ).spawn,
	util = require( 'util' );

function Instance( options ) {
	var that = this;

	EventEmitter.call( this );

	this.command = options.command;
	this.args = options.args;
	this.image = options.image;

	this.proc = spawn( this.command, this.args, {
		env: options.env,
		cwd: options.cwd
	} );

	this.pid = this.proc.pid;
	this.stdout = this.proc.stdout;
	this.stderr = this.proc.stderr;

	this.proc.on( 'exit', function( code, signal ) {
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
		spawn( 'taskkill /IM ' + this.image || basename( this.command ) )
			.on( 'exit', function( code, signal ) {
				that.emit( 'stop', code, signal );
			} );
	} else if ( this.command === 'open' ) {
		spawn( 'osascript -e \'tell application "' + this.command + '" to quit\'' );
	} else {
		this.proc.kill();
	}
};

module.exports = Instance;
