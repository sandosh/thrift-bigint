var bigint = require('bigint');

/**
* node-int64
* From https://github.com/broofa/node-int64
*
* Support for handling 64-bit int numbers in Javascript (node.js)
*
* JS Numbers are IEEE-754 double-precision floats, which limits the range of
* integer values that can be accurately represented to +/- 2^^53.
*
* Int64 objects wrap a node Buffer that holds the 8-bytes of int64 data.  These
* objects operate directly on the buffer, which means that if they are created
* using an existing buffer, setting the value will modify the Buffer and
* vice-versa.
*/

// Useful masks and values for doing bit twiddling
var MASK31 =  0x7fffffff, VAL31 = 0x80000000;
var MASK32 =  0xffffffff, VAL32 = 0x100000000;

// Map for converting hex octets to strings
var _HEX = [];
for (var i = 0; i < 256; i++) _HEX[i] = (i > 0xF ? '' : '0') + i.toString(16);

//
// Int64
//

/**
* Constructor accepts the following arguments:
*
* new Int64(buffer[, offset=0]) - Existing Buffer with byte offset
* new Int64(string)             - Hex string (throws if n is outside int64 range)
* new Int64(number)             - Number (throws if n is outside int64 range)
* new Int64(hi, lo)             - Raw bits as two 32-bit values
*/
var Int64 = module.exports = function(a1, a2) {
  if (a1 instanceof Buffer) {
    this.buffer = a1;
    this.bigint = bigint.fromBuffer(this.buffer);
    this.offset = a2 || 0;
  } else {
    this.buffer = this.buffer || new Buffer(8);
    this.offset = 0;
    this.setValue.apply(this, arguments);
  }
};


// Max integer value that JS can accurately represent
Int64.MAX_INT = Math.pow(2, 53);

// Min integer value that JS can accurately represent
Int64.MIN_INT = -Math.pow(2, 53);

Int64.prototype = {
  /**
  * Do in-place 2's compliment.  See
  * http://en.wikipedia.org/wiki/Two's_complement
  */
  _2scomp: function() {
    var b = this.buffer, o = this.offset, carry = 1;
    for (var i = o + 7; i >= o; i--) {
      var v = (b[i] ^ 0xff) + carry;
      b[i] = v & 0xff;
      carry = v >> 8;
    }
  },

  /**
  * Set the value:
  * setValue(string) - A hexidecimal string
  * setValue(number) - Number (throws if n is outside int64 range)
  * setValue(hi, lo) - Raw bits as two 32-bit values
  */
  setValue: function(hi, lo) {
    this.bigint = bigint(hi);
    this.buffer = this.bigint.toBuffer();
  },

  /**
  * Return the approximate error involved in converting the current value to a
  * native JS number.  If > 0, the value is outside the range JS can represent
  * to integer precision.
  */
  error: function() {
    return Math.ceil(Math.abs(this.valueOf()) / Int64.MAX_INT) - 1;
  },

  /**
  * Convert to a JS Number.
  *
  * Be aware that if the returned value is outside the range ...
  *
  *     Int64.MIN_INT <= x <= Int64.MAX_INT
  *
  * ... it is unlikely to exactly represent the underlying 64-bit value.
  */
  valueOf: function() {
    return this.bigint.toString();
  },

  /**
  * Get value as a string of hex octets
  *
  * @param sep (String) string to join() with. Default=''
  */
  toString: function(sep) {
    //console.log('to string', this.buffer, bigint.fromBuffer(this.buffer).toString());
    return this.bigint.toString();
  },

  /**
   * Used by console.log and util.inspect.
   */
  inspect: function() {
    var value = this.valueOf()
    if (value < Int64.MAX_INT && value > Int64.MIN_INT) {
      return "<Int64 " + value + ">";
    } else {
      return "<Int64 " + this.toString() + ">";
    }
  }
};

