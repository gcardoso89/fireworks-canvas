/**
 * Request animation frame polyfill by Erik Möller
 */
(function() {
	var lastTime = 0;
	var vendors = ['webkit', 'moz'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame =
			window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());


/**
 * Convert HEX color to RGB color object.
 * @param hex
 * @returns {{r: Number, g: Number, b: Number}}
 */
function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

/**
 * Fireworks Object
 * This object is responsible to start the fireworks show, loading the fire elements within a XML file.
 */
function Fireworks(){

	this.canvas = document.getElementById('fireworks');
	this.ctx = this.canvas.getContext('2d');
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;

	this.fireworks = [];

}

Fireworks.prototype.startShow = function(){

	this.loadData();

};

Fireworks.prototype.loadData = function(){

	var _this = this;

	$.ajax({
		url : 'fireworks.xml',
		dataType : 'xml',
		success : function(data){
			_this.processData($.xml2json(data));
			_this.startAnimation();
		},
		error : function(){
			var h1 = document.createElement('h1');
			document.body.appendChild(h1);
			h1.innerHTML = "Fireworks Show can't start";
		}
	})

};

/**
 * This method receives the XML data converted to JSON and creates the fire elements depending on each type.
 * @param data
 */

Fireworks.prototype.processData = function(data){



	for (var i = 0; i < data.Firework.length; i++) {

		var obj = data.Firework[i];

		switch (obj.type){

			case "Fountain":
				this.fireworks.push(new Fountain(obj, this.canvas, this.ctx));
				break;

			case "Rocket":
				this.fireworks.push(new Rocket(obj, this.canvas, this.ctx));
				break;

		}

	}
	
};

/**
 * This method is responsible for starting the Fireworks show.
 * It's constantly checking if all the fire elements are already stopped, to restart the Fireworks' show.
 */

Fireworks.prototype.startAnimation = function(){

	var _this = this;
	var allEnded = false;

	(function animate (){

		requestAnimationFrame(animate);

		_this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);

		allEnded = true;
		for (var i = 0; i < _this.fireworks.length; i++) {
			var obj = _this.fireworks[i];
			obj.start();
			if (!obj.ended) allEnded = false;
		}

		if (allEnded) {
			for (var z = 0; z < _this.fireworks.length; z++) {
				var fire = _this.fireworks[z];
				fire.restart();
			}
		}

	})();

};

/**
 * Fire element with type "Fountain"
 * This object is created for each XML node with type "Fountain"
 */

function Fountain(data, canvas, context){


	this.canvas = canvas;
	this.ctx = context;

	this.x = (this.canvas.width/2) + parseInt(data.Position.x,10);
	this.y = this.canvas.height;

	this.color = data.colour.replace('0x','#');

	this.maxY = parseInt(data.Position.y,10);

	this.startingPoint = data.begin;
	this.endingPoint = data.duration;

	this.canStart = false;
	this.canStop = false;

	this.nrParticles = 200;
	this.particles = [];

	for (var i = 0; i < this.nrParticles; i++) {
		var particle = new Particle(this.x,this.y,this.color,this.ctx,this.maxY,null);
		this.particles.push(particle);
	}

	this.ended = false;
	this.started = false;

}

Fountain.prototype.start = function(){

	var _this = this;

	if(!this.started) {

		setTimeout(function(){

			setTimeout(function(){
				_this.canStop = true;
			}, _this.endingPoint);

			_this.canStart = true;

		},this.startingPoint);

		this.started = true;
	}

	if ( !_this.canStart ) return;

	this.particles.forEach(function(part) {

		part.x += part.vx;
		part.y += part.vy;

		if ( part.x + part.radius > _this.canvas.width || part.x - part.radius < 0 || part.y + part.radius < _this.canvas.height + part.maxY ) {

			if ( _this.canStop ) {
				part.isDone = true;
				return;
			}

			part.x = part.initX;
			part.y = part.initY - part.radius;
			part.vx = Math.random() * 4 - 2;
			part.vy = Math.random() * - 10 - 5;
			part.isReady = true;
		}

		part.draw();

	});

	//Check if the fountain's particles are gone
	//If any particle is still animating, then the fountain is not closed yet.
	this.ended = true;
	this.particles.forEach(function(part){
		if(!part.isDone) _this.ended = false;
	});

};



Fountain.prototype.restart = function(){

	this.particles.forEach(function(part){
		part.init();
	});

	this.started = false;
	this.canStart = false;
	this.canStop = false;
	this.ended = false;

};

/**
 * Fire element with type "Rocket"
 * This object is created for each XML node with type "Fountain"
 */

function Rocket(data, canvas, context){

	this.radius = 2;

	this.canvas = canvas;
	this.ctx = context;

	this.initX = (this.canvas.width/2) + parseInt(data.Position.x,10);
	this.initY =  this.canvas.height + parseInt(data.Position.y,10);

	this.x = this.initX;
	this.y = this.initY;

	this.vx = parseInt(data.Velocity.x,10) / 60;
	this.vy = -(parseInt(data.Velocity.y,10) / 60);
	this.color = data.colour.replace('0x','#');

	this.startingPoint = data.begin;
	this.endingPoint = data.duration;

	this.startingPoint = data.begin;
	this.endingPoint = data.duration;

	this.canStart = false;
	this.canStop = false;
	this.started = false;
	this.ended = false;

	this.nrParticles = 500;
	this.particles = [];

}

Rocket.prototype.start = function(){

	var _this = this;

	//Begin and duration of the fire element.
	//When it reaches the end of duration, the Particles Explosion can be created (variable canStop)
	if (!this.started){
		setTimeout(function(){
			_this.canStart = true;

			setTimeout(function(){
				_this.canStop = true;
			}, _this.endingPoint);

		}, _this.startingPoint);

		_this.started = true;
	}

	if ( this.canStart ){

		if ( !this.canStop) {
			this.drawRocket();
		}

		//Particles Explosion creation and animation;
		else {

			if (this.particles.length == 0){
				for (var i = 0; i < this.nrParticles; i++) {
					var particle = new Particle(this.x,this.y,this.color,this.ctx,this.maxY,Math.random() * (Math.PI*2));
					particle.isReady = true;
					particle.startLifeCountdown();
					this.particles.push(particle);
				}
			}

			this.particles.forEach(function(part){

				part.defVel *= 0.91;

				part.x += Math.cos( part.angle ) * part.defVel;
				part.y += Math.sin( part.angle ) * part.defVel + 4;


				if (part.isFading) part.opacity -= 0.1;

				if (!part.isDone) part.draw();

			});

			//Check if the fountain's particles are gone
			//If any particle is still animating, then the fountain is not closed yet.
			this.ended = true;
			this.particles.forEach(function(part){
				if(!part.isDone) _this.ended = false;
			});

		}

	}

};

Rocket.prototype.drawRocket = function(){

	this.x += this.vx;
	this.y += this.vy;

	if ( this.y < 20 ) this.canStop = true;

	this.ctx.fillStyle = this.color;

	this.ctx.beginPath();
	this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
	this.ctx.fill();
	this.ctx.closePath();

};

Rocket.prototype.restart =function(){

	this.particles = [];

	this.x = this.initX;
	this.y = this.initY;

	this.started = false;
	this.canStart = false;
	this.canStop = false;
	this.ended = false;

};

/**
 * Particle object.
 * This object is used by each fire element
 */

function Particle(x,y,color,ctx,maxY,angle) {

	this.radius = 2;

	this.angle = angle;

	this.initX = x;
	this.initY = y + (this.radius*2);
	this.maxY = maxY + Math.random() * 100;
	this.colorObj = hexToRgb(color);
	this.defColorObj = hexToRgb('#000000');
	this.opacity = 1;
	this.isFading = false;

	this.defColor = 'rgba(' + this.defColorObj.r + ',' + this.defColorObj.g + ',' + this.defColorObj.b + ',1)';
	this.ctx = ctx;
	this.defVel = Math.random() * -30 - 2;

	this.init();

}

Particle.prototype.init = function(){

	this.isDone = false;
	this.isReady = false;

	this.x = this.initX;
	this.y = this.initY;

	this.vx = Math.random() * 4 - 2;
	this.vy = Math.random() * -100 - 7;

};

Particle.prototype.draw = function(){

	this.ctx.fillStyle = (this.isReady) ? 'rgba(' + this.colorObj.r + ',' + this.colorObj.g + ',' + this.colorObj.b + ',' + this.opacity + ')' : this.defColor;
	this.ctx.beginPath();
	this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
	this.ctx.fill();
	this.ctx.closePath();

};

Particle.prototype.startLifeCountdown = function(){

	var _this = this;

	setTimeout(function(){

		_this.isFading -= true;
		setTimeout(function(){
			_this.isDone = true;
		}, 500);

	}, Math.random() * ( 850 - 400 ) + 400);

};



var fire = new Fireworks();
fire.startShow();
