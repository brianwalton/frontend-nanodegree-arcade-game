//
// Adapted from Rob Gravelle - Some Useful JavaScript Object Creation Patterns
// http://www.htmlgoodies.com/html5/javascript/some-useful-javascript-object-creation-patterns.html#fbid=f-vQ497cSi2
//
// parent constructor
function GemsFactory() {
    this.x = 0;
    this.y = 83;
    this.spriteWidth = 0;
}

//override toString()
GemsFactory.prototype.prString = function() {
    return "You get " + this.points + " for this gem.";
};

GemsFactory.prototype.update = function() {
    //  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Taken from:
// http://stackoverflow.com/questions/6658223/javascript-item-splice-self-out-of-list
GemsFactory.prototype.delete = function() {
    var idx = allGems.indexOf(this);
    allGems[idx] = null;
    allGems.splice(idx, 1)
};

// Draw the gem on the board
GemsFactory.prototype.render = function() {
    board.drawBoard(Resources.get(this.sprite), this.x, this.y, 50, 85);
};

GemsFactory.prototype.sound = function() {
    if (!this.gemSound) {
        // http://www.findsounds.com/
        //    --> 	http://www.drodd.com/sound-effects/Crystal-06.wav
        this.gemSound = new Audio('sounds/Crystal-06.wav');
    }
    this.gemSound.play();
}


// the static factory method
GemsFactory.build = function(constr) {
    // Throw an error if no constructor for the given Gem
    if (typeof GemsFactory[constr] !== "function") {
        console.log("You cannot create " + constr + " Gems in this factory");
    }

    for (var fn in GemsFactory.prototype) {
        // Here, the method borrowing technique is used to
        // selectively inherit from the GemsFactory
        if (typeof GemsFactory[constr].prototype[fn] !== "function" ||
            GemsFactory[constr].prototype[fn].toString().indexOf('[native code]') > -1) {
            GemsFactory[constr].prototype[fn] = GemsFactory.prototype[fn];
        }
    }
    // create a new Gem using the factory
    return new GemsFactory[constr]();
};

// define specific Gem makers
GemsFactory.OrangeGem = function() {
    this.sprite = 'images/Gem Orange.png';
    this.points = 10;
    this.x = 0;
    this.y = 115;
    this.spriteWidth = 50;
};

GemsFactory.GreenGem = function() {
    this.sprite = 'images/Gem Green.png';
    this.points = 20;
    this.x = 0;
    this.y = 115;
    this.spriteWidth = 50;
};

GemsFactory.HeartGem = function() {
    this.sprite = 'images/Heart.png';
    this.points = 1;
    this.x = 0;
    this.y = 115;
    this.spriteWidth = 50;
};
