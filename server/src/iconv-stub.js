module.exports = {
  encodingExists: function () { return true; },
  decode: function (buf) { return Buffer.from(buf).toString('utf8'); },
  encode: function (str) { return Buffer.from(String(str), 'utf8'); },
  decodeStream: function () { throw new Error('iconv decodeStream not supported'); },
  encodeStream: function () { throw new Error('iconv encodeStream not supported'); }
};
