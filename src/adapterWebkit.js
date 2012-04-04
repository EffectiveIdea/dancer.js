(function() {
  SAMPLE_SIZE = 2048;

  var adapter = function ( danceInstance ) {
    this.danceInstance = danceInstance;
    this.context = new ( window.AudioContext || window.webkitAudioContext )();
    window.test = this;
  }

  adapter.prototype = {
    load : function ( path, callback ) {
      var
        req = new XMLHttpRequest(),
        _this = this;

      this.source = this.context.createBufferSource();
      this.loaded = false;

      req.open( 'GET', path, true );
      req.responseType = 'arraybuffer';

      req.onload = function () {
        if ( _this.context.decodeAudioData ) {
          _this.context.decodeAudioData( req.response, function( buffer ) {
            _this.source.buffer = buffer;
          }, function( e ) {
            console.log( e );
          });
        } else {
          _this.source.buffer = _this.context.createBuffer( req.response, false );
        }
        _this.source.connect( _this.context.destination );
        _this.source.connect( _this.fft );
        _this.fft.connect( _this.proc );
        _this.proc.connect( _this.context.destination );
        _this.loaded = true;
      };
      req.send();

      this.proc = this.context.createJavaScriptNode( SAMPLE_SIZE / 2, 1, 1 );
      this.proc.onaudioprocess = function() { _this.update.call( _this ); };
      this.source.connect( this.context.destination );

      this.fft    = this.context.createAnalyser();
      this.data   = new Uint8Array( this.fft.frequencyBinCount );
    },
    play : function () {
      var _this = this;
      (function play() {
        setTimeout(function() {
          _this.loaded ? _this.source.noteOn( 0.0 ) : play();
        }, 10);
      })();
    },
    stop : function () { this.source.noteOff(0); },
    getSpectrum : function () { return this.data; },
    getTime : function () { return this.context.currentTime; },
    update : function ( e ) {
      this.fft.getByteFrequencyData( this.data );
      this.danceInstance._update();
    }
  };

  Dance.adapters.webkit = adapter;

})();
