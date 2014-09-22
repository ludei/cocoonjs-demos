var Puzzle= Puzzle || {};

(function() {

    Puzzle.Game= function() {
        Puzzle.Game.superclass.constructor.call(this);
        this.enableEvents(false);
        return this;
    };

    Puzzle.Game.prototype= {

        image       : null,
        rows        : 1,
        columns     : 1,

        width       : 0,
        height      : 0,

        pieceWidth  : 0,
        pieceHeight : 0,

        pieces      : null,

        director    : null,

        setImage : function( director, image ) {
            this.director= director;
            this.setFillStyle( '#eee' );
            this.image= image;
            return this;
        },

        setTable : function( r, c, w, h ) {
            var i;

            this.width= w;
            this.height= h;
            this.rows= r;
            this.columns= c;
            this.pieces= [];

            var sc= new CAAT.SpriteImage().initialize( this.image, r, c );
            var me= this;

            this.pieceWidth= sc.singleWidth;
            this.pieceHeight= sc.singleHeight;

            this.emptyChildren();
            for( i=0; i<r*c; i++ ) {
                var piece= new CAAT.Actor().
                    setBackgroundImage( sc.getRef()).
                    setSpriteIndex(i).
                    enableDrag().
                    setId( i );

                var pp= this.getPiecePosition(i);
                piece.setLocation( pp.x, pp.y );
                this.addChild( piece );
                this.pieces.push( piece );

                (function(piece) {
                    piece.__mouseUp= piece.mouseUp;
                    piece.__mouseDown= piece.mouseDown;

                    piece.mouseUp= function(e) {
                        this.__mouseUp.call(this,e);
                        me.pieceMoved( this );
                        me.director.audioPlay("12");
                    },

                    piece.mouseDown= function(e) {
                        me.director.audioPlay("11");
                        this.emptyBehaviorList();
                        this.parent.setZOrder( this,Number.MAX_VALUE )
                        me.startMovePiece( this );
                    }

                })(piece);

            }

            return this;
        },

        start : function() {
            var i, me= this;

            for( i=0; i<this.rows*this.columns; i++ ) {
                this.setPieceAt(i,null,i*50);
            }

            setTimeout( function() {
                me.enableEvents(true);
            }, this.rows*this.columns*50 );
        },

        startMovePiece : function( piece ) {
            for( var i=0; i<this.pieces.length; i++ ) {
                if ( this.pieces[i] && this.pieces[i].id===piece.id ) {
                    this.pieces[ i ] = null;
                    return;
                }
            }
        },

        setPieceAt : function( index, newPiece, delay ) {
            if ( this.pieces[index]===newPiece ) {
                return;
            }

            var radiusX= this.width/2 - this.pieceWidth/2;
            var radiusY= this.height/2 - this.pieceHeight/2;
            var angle= 2*Math.PI*Math.random();

            if ( this.pieces[index]!==null ) {
                this.movePiece(
                    this.pieces[index],
                    this.width/2 - radiusX*Math.cos(angle) - this.pieceWidth/2,
                    this.height/2 - radiusY*Math.sin(angle) - this.pieceHeight/2,
                    delay);
                this.pieces[index]= null;
            }

            this.pieces[index]= newPiece;

            if ( null!==newPiece ) {
                var pp= this.getPiecePosition( index );
                this.movePiece( newPiece, pp.x, pp.y, delay );
            }
        },

        getPiecePosition : function( index ) {
            return {
                x : this.width/2  - ( this.columns/2 - (index%this.columns) )*this.pieceWidth,
                y : this.height/2 - ( this.rows/2 - ((index/this.columns)>>0) )*this.pieceHeight
            };
        },

        pieceMoved : function( piece ) {
            var x= piece.x + piece.width / 2;
            var y= piece.y + piece.height / 2;

            x-= (this.width - this.columns*this.pieceWidth)/2;
            if ( x<0 || x>this.pieceWidth*this.columns ) {
                return;
            }
            y-= (this.height - this.rows*this.pieceHeight)/2;
            if ( y<0 || y>this.pieceHeight*this.rows ) {
                return;
            }

            var row= (y/this.pieceHeight)>>0;
            var col= (x/this.pieceWidth)>>0;

            var index= col + row*this.columns;
            this.setPieceAt( index, piece, 50 )

            for( var i=0; i<this.pieces.length; i++ ) {
                if ( !this.pieces[i] || this.pieces[i].id!==i ) {
                    return;
                }
            }

            this.director.audioPlay("win");

            alert("You did it.");
        },

        movePiece : function( piece, x, y, delay ) {
            piece.emptyBehaviorList().
                addBehavior(
                    new CAAT.PathBehavior().
                        setValues( new CAAT.Path().setLinear( piece.x, piece.y, x, y )).
                        setDelayTime( delay, 2000).
                        setInterpolator( new CAAT.Interpolator().createExponentialOutInterpolator(3, false) )
                );
        },

        paint : function( director, time ) {

            Puzzle.Game.superclass.paint.call(this,director,time);

            var ctx= director.ctx;

            ctx.strokeStyle='#000';
            for(var i=0; i<this.rows*this.columns; i++ ) {
                var p= this.getPiecePosition(i);
                ctx.strokeRect( (p.x|0)+.5, (p.y|0)+.5, this.pieceWidth, this.pieceHeight );
            }
        }

    };

    extend( Puzzle.Game, CAAT.ActorContainer );
})();