/**
 *  LeadSourceTrackingUtil.js
 *  lst_util
 *
 *  v0.0.3
 */
( function( root, options ) {

	"use strict";

	// requirments
	if ( !( options && typeof options == 'object' && ( function( k, o ) {
			for ( var i = 0, r = 1; r && i < k.length; r = k[ i++ ] in o );
			return r;
		} )( [ 'ajaxurl', 'action', 'cookie_name', 'cookie_duration_in_days' ], options ) ) ) {
		return;
	}

	// constants
	const AJAXURL    = options.ajaxurl;
	const ACTION     = options.action;
	const COOKIENAME = options.cookie_name;
	const DURATION   = options.cookie_duration_in_days;

	const SOURCE     = "utm_source";
	const MEDIUM     = "utm_medium";
	const CONTENT    = "utm_content";
	const CAMPAIGN   = "utm_campaign";
	const TERM       = "utm_term";

	// methods
	var processLeadSourceTracking = function() {
		var urlReferrer = "";
		if ( document.referrer != null ) {
			urlReferrer = document.referrer;
		}
		if ( getDomain( urlReferrer ) !== getDomain( window.location.hostname ) ) {
			setTrackingParams();
		}
	}

	var setTrackingParams = function() {
		var util = new LeadSourceTrackingUtil();
		if ( util.isFresh() ) {
			new Cookie( COOKIENAME )
				.add( SOURCE, util.getSource() )
				.add( MEDIUM, util.getMedium() )
				.add( CONTENT, util.getContent() )
				.add( CAMPAIGN, util.getCampaign() )
				.add( TERM, util.getTerm() )
				.set( DURATION );
		}
		requestSession(  /*function( XHR ){console.log( XHR,Util )}*/  );
	}

	var requestSession = function( callback ) {
		var XHR = new XMLHttpRequest();
			XHR.addEventListener( 'load', function( event ) {
				event.response        = JSON.parse( this.responseText );
				var evt               = new ProgressEvent( ACTION, event );
					evt.originalEvent = event;
				document.dispatchEvent( evt );
				if ( callback && typeof callback == 'function' ) {
					return callback( this.response );
				}
			} );
			XHR.open( "POST", AJAXURL );
			XHR.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
			XHR.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
			XHR.send( "action=" + ACTION );
	}

	// prototypes
	function QueryStrings() {
		try {
			const a = window.location.search.split( /\?/ ).pop();
			const b = deserialize( a );
			for ( var c in b ) {
				this[ c ] = b[ c ];
			}
		} catch ( e ) {
			console.log( e );
		}
	}

	function Cookies() {
		var i, x, y, c = document.cookie.split( ";" ),
			o = {},
			name;
		if ( arguments && arguments.length == 1 && typeof arguments[ 0 ] == 'string' ) {
			name = arguments[ 0 ];
		}
		try {
			for ( i = 0; i < c.length; i++ ) {
				x = c[ i ].substring( 0, c[ i ].indexOf( "=" ) );
				y = deserialize( unescape( c[ i ].substring( c[ i ].indexOf( "=" ) + 1 ) ) );
				x = x.replace( /^\s+|\s+$/g, "" );
				if ( name ) {
					if ( x == name ) {
						o[ x ] = y;
						break;
					}
				} else {
					o[ x ] = y;
				}
			}
			for ( var k in o ) {
				this[ k ] = o[ k ];
			}
		} catch ( e ) {
			console.log( e );
		}
	}

	function Cookie( name ) {
		Cookies.call( this, name );
		this.name = name;
		this.add = function() {
			switch ( arguments.length ) {
				case 2:
					this[ this.name ] = typeof this[ this.name ] != 'object' ? {} : this[ this.name ];
					this[ this.name ][ arguments[ 0 ] ] = arguments[ 1 ];
					break;
				case 1:
				default:
					this[ this.name ] = arguments[ 0 ];
					break;
			}
			return this;
		}
		this.get = function() {
			return this[ this.name ];
		}
		this.set = function( expires = -1 ) {
			try {
				var exdate = new Date();
				exdate.setDate( exdate.getDate() + expires );
				var value       = escape( serialize( this.get() ) ) + ( ( expires == -1 ) ? "" : "; expires=" + exdate.toUTCString() );
				document.cookie = this.name + "=" + value + "; path=/;";
			} catch ( e ) {
				console.log( e );
			}
		}
	}
	Cookie.prototype = Object.create( Cookies.prototype );

	function LeadSourceTrackingUtil() {
		this.qs = new QueryStrings();
		this.cookie = getCookie( COOKIENAME );
		this.isFresh = function() { 
			return this.qs[ SOURCE ] != null && this.cookie == false;
		}
		this.getSource = function() {
			if ( this.qs[ SOURCE ] != null ) {
				return this.qs[ SOURCE ];
			}
			return "";
		}
		this.getMedium = function() {
			if ( this.qs[ MEDIUM ] != null ) {
				return this.qs[ MEDIUM ];
			}
			return "";
		}
		this.getContent = function() {
			if ( this.qs[ CONTENT ] != null ) {
				return this.qs[ CONTENT ];
			}
			return "";
		}
		this.getCampaign = function() {
			if ( this.qs[ CAMPAIGN ] != null ) {
				return this.qs[ CAMPAIGN ];
			}
			return "";
		}
		this.getTerm = function() {
			if ( this.qs[ TERM ] != null ) {
				return this.qs[ TERM ];
			}
			return "";
		}
	}

	// helper functions
	function getCookie( name ) {
		var c = new Cookies( name );
		return ( name in c && c[ name ] );
	}

	function getDomain( host ) {
		var domain = host.replace( /^https?:\/\//, "" ).split( "/" ).shift().split( "." );
		return [  domain[  domain.length - 2  ], domain[  domain.length - 1  ]  ].join( "." ).toLowerCase();
	}

	function serialize( obj, prefix ) {
		if ( typeof obj == 'string' ) {
			return obj;
		}
		var str = [];
		for ( var p in obj ) {
			if ( obj.hasOwnProperty( p ) ) {
				var k = prefix ? prefix + "[" + p + "]" : p,
					v = obj[ p ];
				str.push( ( v !== null && typeof v === 'object' ) ? serialize( v, k ) : encodeURIComponent( k ) + "=" + encodeURIComponent( v !== null ? v : "" ) );
			}
		}
		return str.join( "&" );
	}

	function deserialize( str ) {
		var qso = {};
		// Check for an empty querystring
		if ( str == "" ) {
			return qso;
		}
		// Normalize the querystring
		str = str.replace( /(^\?)/, "" ).replace( /;/g, "&" );
		while ( str.indexOf( "&&" ) != -1 ) {
			str = str.replace( /&&/g, "&" );
		}
		str = str.replace( /([\&]+$)/, "" );
		// Break the querystring into parts
		var qs = str.split( "&" );
		// Build the querystring object
		for ( var i = 0; i < qs.length; i++ ) {
			var qi = qs[ i ].split( "=" );
			qi = [ decodeURIComponent( qi[ 0 ] ), decodeURIComponent( qi[ 1 ] ) ];
			if ( qso[ qi[ 0 ] ] != undefined ) {
				// If a key already exists then make this an object
				if ( typeof qso[ qi[ 0 ] ] == 'string' ) {
					var qt = qso[ qi[ 0 ] ];
					if ( qi[ 1 ] == "" || qi[ 1 ] == 'undefined' ) {
						qi[ 1 ] = null;
					}
					qso[ qi[ 0 ] ] = [];
					qso[ qi[ 0 ] ].push( qt );
					qso[ qi[ 0 ] ].push( qi[ 1 ] );
				} else if ( typeof qso[ qi[ 0 ] ] == 'object' ) {
					if ( qi[ 1 ] == "" || qi[ 1 ] == 'undefined' ) {
						qi[ 1 ] = null;
					}
					qso[ qi[ 0 ] ].push( qi[ 1 ] );
				}
			} else {
				// If no key exists just set it as a string
				if ( qi[ 1 ] == "" || qi[ 1 ] == 'undefined' ) {
					qi[ 1 ] = null;
				}
				qso[ qi[ 0 ] ] = qi[ 1 ];
			}
		}
		var nqso = {},
			a, j, k, o, p, q;
		for ( var i in qso ) {
			a = i.match( /([^\[\]]+)(\[[^\[\]]+[^\]])*?/g );
			p = qso[ i ];
			j = a && a.length;
			while ( j-- ) {
				q = {};
				q[ a[ j ] ] = p;
				p = q;
			}
			// merge object
			k = Object.keys( p )[ 0 ];
			o = nqso;
			while ( k in o ) {
				p = p[ k ];
				o = o[ k ];
				k = Object.keys( p )[ 0 ];
			}
			o[ k ] = p[ k ];
		}
		if ( Object.keys( nqso ).length === 1 && nqso[ Object.keys( nqso )[ 0 ] ] === 'undefined' ) {
			return Object.keys( nqso )[ 0 ];
		}
		return nqso;
	}

	document.addEventListener( ACTION, function( event ) {
		console.log( event.originalEvent.response );
	} );

	// localize proccess method
	root.processLeadSourceTrackingUtil = { requestSession: requestSession, processLeadSourceTracking: processLeadSourceTracking };

	processLeadSourceTracking();

} )( this, lst_util );
