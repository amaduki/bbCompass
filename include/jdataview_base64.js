(function (global) {

//
//  code is quoated from...
//    base64.js,v 1.2 2011/12/27 14:34:49 dankogai Exp dankogai
//    https://github.com/dankogai/js-base64
//

var b64chars 
    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var b64tab = function(bin){
    var t = {};
    for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
    return t;
}(b64chars);

var sub_toBase64 = function(m, Offset){
    var len=m.byteLength;
    var n = (Offset>=len   ? 0 :m.getUint8(Offset)   << 16)
          | (Offset+1>=len ? 0 :m.getUint8(Offset+1) <<  8)
          | (Offset+2>=len ? 0 :m.getUint8(Offset+2)      );
    return b64chars.charAt( n >>> 18)
         + b64chars.charAt((n >>> 12) & 63)
         + b64chars.charAt((n >>>  6) & 63)
         + b64chars.charAt( n         & 63);
};

var toBase64 = function(view){
    var padlen = (view.byteLength % 3)?(3-(view.byteLength % 3)):0;
    var i;
    var b64="";

    for (i=0;i<view.byteLength+padlen;i=i+3) {
        b64 = b64+sub_toBase64(view,i);
    }

    b64 = b64.substr(0, b64.length - padlen);

    return b64.replace(/[+\/]/g, function(m0){
                                     return m0 == '+' ? '-' : '_';
                                 });
};

var sub_fromBase64 = function(m, Offset){
    var ret= new Array();
    var n = (b64tab[ m.charAt(Offset    ) ] << 18)
          | (b64tab[ m.charAt(Offset + 1) ] << 12)
          | (b64tab[ m.charAt(Offset + 2) ] <<  6)
          | (b64tab[ m.charAt(Offset + 3) ]);

    ret.push(((n >> 16)       ),
             ((n >>  8) & 0xff),
             ((n      ) & 0xff));

    return ret;
};

var fromBase64 = function(b64){
    b64 = b64.replace(/[-_]/g, function(m0){
                                   return m0 == '-' ? '+' : '/';
                               })
             .replace(/[^A-Za-z0-9\+\/]/g, '');
    var padlen = 0;
    var data = new Array();
    var i;

    while(b64.length % 4){
        b64 += 'A';
        padlen++;
    }

    for (i=0;i<b64.length;i=i+4) {
        data=data.concat(sub_fromBase64(b64,i));
    }

    data = data.slice(0, data.length - [0,1,2,3][padlen]);
    return data;
};


//
//  code is quoated from...
//    jDataView by Vjeux - Jan 2010
//     http://github.com/vjeux/jDataView
//


var compatibility = {
	ArrayBuffer: typeof ArrayBuffer !== 'undefined',
	DataView: typeof DataView !== 'undefined' &&
		('getFloat64' in DataView.prototype ||				// Chrome
		 'getFloat64' in new DataView(new ArrayBuffer(1))), // Node
	// NodeJS Buffer in v0.5.5 and newer
	NodeBuffer: typeof Buffer !== 'undefined' && 'readInt16LE' in Buffer.prototype
};

var dataTypes = {
	'Int8': 1,
	'Int16': 2,
	'Int32': 4,
	'Uint8': 1,
	'Uint16': 2,
	'Uint32': 4,
	'Float32': 4,
	'Float64': 8
};

var nodeNaming = {
	'Int8': 'Int8',
	'Int16': 'Int16',
	'Int32': 'Int32',
	'Uint8': 'UInt8',
	'Uint16': 'UInt16',
	'Uint32': 'UInt32',
	'Float32': 'Float',
	'Float64': 'Double'
};

var jDataView = function (buffer, byteOffset, byteLength, littleEndian) {
	if (!(this instanceof jDataView)) {
		throw new Error("jDataView constructor may not be called as a function");
	}

	this.buffer = buffer;

	// Handle Type Errors
	if (!(compatibility.NodeBuffer && buffer instanceof Buffer) &&
		!(compatibility.ArrayBuffer && buffer instanceof ArrayBuffer) &&
		typeof buffer !== 'string') {
		throw new TypeError('jDataView buffer has an incompatible type');
	}

	// Check parameters and existing functionnalities
	this._isArrayBuffer = compatibility.ArrayBuffer && buffer instanceof ArrayBuffer;
	this._isDataView = compatibility.DataView && this._isArrayBuffer;
	this._isNodeBuffer = compatibility.NodeBuffer && buffer instanceof Buffer;

	// Default Values
	this._littleEndian = littleEndian === undefined ? false : littleEndian;

	var bufferLength = this._isArrayBuffer ? buffer.byteLength : buffer.length;
	if (byteOffset === undefined) {
		byteOffset = 0;
	}
	this.byteOffset = byteOffset;

	if (byteLength === undefined) {
		byteLength = bufferLength - byteOffset;
	}
	this.byteLength = byteLength;

	if (!this._isDataView) {
		// Do additional checks to simulate DataView
		if (typeof byteOffset !== 'number') {
			throw new TypeError('jDataView byteOffset is not a number');
		}
		if (typeof byteLength !== 'number') {
			throw new TypeError('jDataView byteLength is not a number');
		}
		if (byteOffset < 0) {
			throw new Error('jDataView byteOffset is negative');
		}
		if (byteLength < 0) {
			throw new Error('jDataView byteLength is negative');
		}
	}

	// Instanciate
	if (this._isDataView) {
		this._view = new DataView(buffer, byteOffset, byteLength);
		this._start = 0;
	}
	this._start = byteOffset;
	if (byteOffset + byteLength > bufferLength) {
		throw new Error("jDataView (byteOffset + byteLength) value is out of bounds");
	}

	this._offset = 0;

	// Create uniform reading methods (wrappers) for the following data types

	if (this._isDataView) { // DataView: we use the direct method
		for (var type in dataTypes) {
			if (!dataTypes.hasOwnProperty(type)) {
				continue;
			}
			(function(type, view){
				var size = dataTypes[type];
				view['get' + type] = function (byteOffset, littleEndian) {
					// Handle the lack of endianness
					if (littleEndian === undefined) {
						littleEndian = view._littleEndian;
					}

					// Handle the lack of byteOffset
					if (byteOffset === undefined) {
						byteOffset = view._offset;
					}

					// Move the internal offset forward
					view._offset = byteOffset + size;

					return view._view['get' + type](byteOffset, littleEndian);
				}
			})(type, this);
		}
	} else if (this._isNodeBuffer && compatibility.NodeBuffer) {
		for (var type in dataTypes) {
			if (!dataTypes.hasOwnProperty(type)) {
				continue;
			}

			var name;
			if (type === 'Int8' || type === 'Uint8') {
				name = 'read' + nodeNaming[type];
			} else if (littleEndian) {
				name = 'read' + nodeNaming[type] + 'LE';
			} else {
				name = 'read' + nodeNaming[type] + 'BE';
			}

			(function(type, view, name){
				var size = dataTypes[type];
				view['get' + type] = function (byteOffset, littleEndian) {
					// Handle the lack of endianness
					if (littleEndian === undefined) {
						littleEndian = view._littleEndian;
					}

					// Handle the lack of byteOffset
					if (byteOffset === undefined) {
						byteOffset = view._offset;
					}

					// Move the internal offset forward
					view._offset = byteOffset + size;

					return view.buffer[name](view._start + byteOffset);
				}
			})(type, this, name);
		}
	} else {
		for (var type in dataTypes) {
			if (!dataTypes.hasOwnProperty(type)) {
				continue;
			}
			(function(type, view){
				var size = dataTypes[type];
				view['get' + type] = function (byteOffset, littleEndian) {
					// Handle the lack of endianness
					if (littleEndian === undefined) {
						littleEndian = view._littleEndian;
					}

					// Handle the lack of byteOffset
					if (byteOffset === undefined) {
						byteOffset = view._offset;
					}

					// Move the internal offset forward
					view._offset = byteOffset + size;

					if (view._isArrayBuffer && (view._start + byteOffset) % size === 0 && (size === 1 || littleEndian)) {
						// ArrayBuffer: we use a typed array of size 1 if the alignment is good
						// ArrayBuffer does not support endianess flag (for size > 1)
						return new global[type + 'Array'](view.buffer, view._start + byteOffset, 1)[0];
					} else {
						// Error checking:
						if (typeof byteOffset !== 'number') {
							throw new TypeError('jDataView byteOffset is not a number');
						}
						if (byteOffset + size > view.byteLength) {
							throw new Error('jDataView (byteOffset + size) value is out of bounds');
						}

						return view['_get' + type](view._start + byteOffset, littleEndian);
					}
				}
			})(type, this);
		}
	}
};

if (compatibility.NodeBuffer) {
	jDataView.createBuffer = function () {
		var buffer = new Buffer(arguments.length);
		for (var i = 0; i < arguments.length; ++i) {
			buffer[i] = arguments[i];
		}
		return buffer;
	}
} else if (compatibility.ArrayBuffer) {
	jDataView.createBuffer = function () {
		var buffer = new ArrayBuffer(arguments.length);
		var view = new Int8Array(buffer);
		for (var i = 0; i < arguments.length; ++i) {
			view[i] = arguments[i];
		}
		return buffer;
	}
} else {
	jDataView.createBuffer = function () {
		return String.fromCharCode.apply(null, arguments);
	}
}

jDataView.fromBase64 = function (str) {
	var data = fromBase64(str);
	data = RawDeflate.inflate(data);
	return new jDataView(this.createBuffer.apply(undefined, data));
};

jDataView.prototype = {
	compatibility: compatibility,

	// Helpers

     toBase64: function() {
         return toBase64(this);
     },

	getString: function (length, byteOffset) {
		var value;
		var byteLength=0;;

		// Handle the lack of byteOffset
		if (byteOffset === undefined) {
			byteOffset = this._offset;
		}
		// Error Checking
		if (typeof byteOffset !== 'number') {
			throw new TypeError('jDataView byteOffset is not a number');
		}
		if (length < 0 || byteOffset + length > this.byteLength) {
			throw new Error('jDataView length or (byteOffset+length) value is out of bounds');
		}

		if (this._isNodeBuffer) {
			value = this.buffer.toString('ucs2', this._start + byteOffset, this._start + byteOffset + length);
		}
		else {
			value = '';
			for (var i = 0; i < length; i++) {
				var char = this.getUint16(byteOffset + byteLength);
				byteLength += 2;

				if ((0xD800 <= char) && (char <= 0xD8FF)) {
					var char2 = this.getUint16(byteOffset + byteLength);
					byteLength += 2;
					value += String.fromCharCode((char2 << 16) | char)
				} else {
					value += String.fromCharCode(char);
				}
			}
		}

		this._offset = byteOffset + byteLength;
		return value;
	},

	getChar: function (byteOffset) {
		return this.getString(1, byteOffset);
	},

	tell: function () {
		return this._offset;
	},

	seek: function (byteOffset) {
		if (typeof byteOffset !== 'number') {
			throw new TypeError('jDataView byteOffset is not a number');
		}
		if (byteOffset < 0 || byteOffset > this.byteLength) {
			throw new Error('jDataView byteOffset value is out of bounds');
		}

		return this._offset = byteOffset;
	},

	// Compatibility functions on a String Buffer

	_endianness: function (byteOffset, pos, max, littleEndian) {
		return byteOffset + (littleEndian ? max - pos - 1 : pos);
	},

	_getFloat64: function (byteOffset, littleEndian) {
		var b0 = this._getUint8(this._endianness(byteOffset, 0, 8, littleEndian)),
			b1 = this._getUint8(this._endianness(byteOffset, 1, 8, littleEndian)),
			b2 = this._getUint8(this._endianness(byteOffset, 2, 8, littleEndian)),
			b3 = this._getUint8(this._endianness(byteOffset, 3, 8, littleEndian)),
			b4 = this._getUint8(this._endianness(byteOffset, 4, 8, littleEndian)),
			b5 = this._getUint8(this._endianness(byteOffset, 5, 8, littleEndian)),
			b6 = this._getUint8(this._endianness(byteOffset, 6, 8, littleEndian)),
			b7 = this._getUint8(this._endianness(byteOffset, 7, 8, littleEndian)),

			sign = 1 - (2 * (b0 >> 7)),
			exponent = ((((b0 << 1) & 0xff) << 3) | (b1 >> 4)) - (Math.pow(2, 10) - 1),

		// Binary operators such as | and << operate on 32 bit values, using + and Math.pow(2) instead
			mantissa = ((b1 & 0x0f) * Math.pow(2, 48)) + (b2 * Math.pow(2, 40)) + (b3 * Math.pow(2, 32)) +
						(b4 * Math.pow(2, 24)) + (b5 * Math.pow(2, 16)) + (b6 * Math.pow(2, 8)) + b7;

		if (exponent === 1024) {
			if (mantissa !== 0) {
				return NaN;
			} else {
				return sign * Infinity;
			}
		}

		if (exponent === -1023) { // Denormalized
			return sign * mantissa * Math.pow(2, -1022 - 52);
		}

		return sign * (1 + mantissa * Math.pow(2, -52)) * Math.pow(2, exponent);
	},

	_getFloat32: function (byteOffset, littleEndian) {
		var b0 = this._getUint8(this._endianness(byteOffset, 0, 4, littleEndian)),
			b1 = this._getUint8(this._endianness(byteOffset, 1, 4, littleEndian)),
			b2 = this._getUint8(this._endianness(byteOffset, 2, 4, littleEndian)),
			b3 = this._getUint8(this._endianness(byteOffset, 3, 4, littleEndian)),

			sign = 1 - (2 * (b0 >> 7)),
			exponent = (((b0 << 1) & 0xff) | (b1 >> 7)) - 127,
			mantissa = ((b1 & 0x7f) << 16) | (b2 << 8) | b3;

		if (exponent === 128) {
			if (mantissa !== 0) {
				return NaN;
			} else {
				return sign * Infinity;
			}
		}

		if (exponent === -127) { // Denormalized
			return sign * mantissa * Math.pow(2, -126 - 23);
		}

		return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
	},

	_getInt32: function (byteOffset, littleEndian) {
		var b = this._getUint32(byteOffset, littleEndian);
		return b > Math.pow(2, 31) - 1 ? b - Math.pow(2, 32) : b;
	},

	_getUint32: function (byteOffset, littleEndian) {
		var b3 = this._getUint8(this._endianness(byteOffset, 0, 4, littleEndian)),
			b2 = this._getUint8(this._endianness(byteOffset, 1, 4, littleEndian)),
			b1 = this._getUint8(this._endianness(byteOffset, 2, 4, littleEndian)),
			b0 = this._getUint8(this._endianness(byteOffset, 3, 4, littleEndian));

		return (b3 * Math.pow(2, 24)) + (b2 << 16) + (b1 << 8) + b0;
	},

	_getInt16: function (byteOffset, littleEndian) {
		var b = this._getUint16(byteOffset, littleEndian);
		return b > Math.pow(2, 15) - 1 ? b - Math.pow(2, 16) : b;
	},

	_getUint16: function (byteOffset, littleEndian) {
		var b1 = this._getUint8(this._endianness(byteOffset, 0, 2, littleEndian)),
			b0 = this._getUint8(this._endianness(byteOffset, 1, 2, littleEndian));

		return (b1 << 8) + b0;
	},

	_getInt8: function (byteOffset) {
		var b = this._getUint8(byteOffset);
		return b > Math.pow(2, 7) - 1 ? b - Math.pow(2, 8) : b;
	},

	_getUint8: function (byteOffset) {
		if (this._isArrayBuffer) {
			return new Uint8Array(this.buffer, byteOffset, 1)[0];
		}
		else if (this._isNodeBuffer) {
			return this.buffer[byteOffset];
		} else {
			return this.buffer.charCodeAt(byteOffset) & 0xff;
		}
	}
};

if (typeof jQuery !== 'undefined' && jQuery.fn.jquery >= "1.6.2") {
	var convertResponseBodyToText = function (byteArray) {
		// http://jsperf.com/vbscript-binary-download/6
		var scrambledStr;
		try {
			scrambledStr = IEBinaryToArray_ByteStr(byteArray);
		} catch (e) {
			// http://stackoverflow.com/questions/1919972/how-do-i-access-xhr-responsebody-for-binary-data-from-javascript-in-ie
			// http://miskun.com/javascript/internet-explorer-and-binary-files-data-access/
			var IEBinaryToArray_ByteStr_Script =
				"Function IEBinaryToArray_ByteStr(Binary)\r\n"+
				"	IEBinaryToArray_ByteStr = CStr(Binary)\r\n"+
				"End Function\r\n"+
				"Function IEBinaryToArray_ByteStr_Last(Binary)\r\n"+
				"	Dim lastIndex\r\n"+
				"	lastIndex = LenB(Binary)\r\n"+
				"	if lastIndex mod 2 Then\r\n"+
				"		IEBinaryToArray_ByteStr_Last = AscB( MidB( Binary, lastIndex, 1 ) )\r\n"+
				"	Else\r\n"+
				"		IEBinaryToArray_ByteStr_Last = -1\r\n"+
				"	End If\r\n"+
				"End Function\r\n";

			// http://msdn.microsoft.com/en-us/library/ms536420(v=vs.85).aspx
			// proprietary IE function
			window.execScript(IEBinaryToArray_ByteStr_Script, 'vbscript');

			scrambledStr = IEBinaryToArray_ByteStr(byteArray);
		}

		var lastChr = IEBinaryToArray_ByteStr_Last(byteArray),
		result = "",
		i = 0,
		l = scrambledStr.length % 8,
		thischar;
		while (i < l) {
			thischar = scrambledStr.charCodeAt(i++);
			result += String.fromCharCode(thischar & 0xff, thischar >> 8);
		}
		l = scrambledStr.length
		while (i < l) {
			result += String.fromCharCode(
				(thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
				(thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
				(thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
				(thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
				(thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
				(thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
				(thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
				(thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8);
		}
		if (lastChr > -1) {
			result += String.fromCharCode(lastChr);
		}
		return result;
	};

}

global.jDataView = (global.module || {}).exports = jDataView;
if (typeof module !== 'undefined') {
	module.exports = jDataView;
}

})(this);
