var b2world;
var b2bods=[];
var b2new=[];
var b2Count=0;
var b2World = function(scaleFactor, gravityVector) {
  // Initialize box2d physics and create the world
  b2world = 
   new box2d.b2World(new box2d.b2Vec2(gravityVector.x,gravityVector.y), true);
  b2scaleFactor = scaleFactor;
}
var b2scaleFactor;
var b2scaleTo = function(a) {
  return new box2d.b2Vec2(a.x/b2scaleFactor,a.y/b2scaleFactor);
}

var b2scaleFrom = function(a) {
  return createVector(a.x*b2scaleFactor,a.y*b2scaleFactor);
}
function b2Update() {
  // 2nd and 3rd arguments are velocity and position iterations
  b2world.Step(1.0/30,10,10);
}
function b2Draw(debug) {
  imageMode(CENTER);
  rectMode(CENTER);
  ellipseMode(CENTER);
  angleMode(RADIANS);
  var i=0;
  while (i<b2bods.length) {
    if (!b2bods[i].body.IsActive() || b2bods[i].draw()) {
      b2world.DestroyBody(b2bods[i].body);
      b2Count--;
      b2bods[i]=b2bods[b2bods.length-1];
      b2bods.pop();
      continue;
    }
    i++;
  }
  if (debug) b2debugDraw(this.canvas, b2scaleFactor, b2world);
  while (b2new.length>0) 
    b2bods.push(b2new.pop());
}
function b2Destroy(body) {
    body.body.SetActive(false);
}
function b2Joint(type, bodyA, bodyB, props) {
    var j;
    if (type=='distance') {
    	j = new box2d.b2DistanceJointDef();
        // Connection between previous and this one
       j.bodyA = bodyA.body;
       j.bodyB = bodyB.body;
       // Equilibrium length
       j.length = props.separation/b2scaleFactor;
       // These properties affect how springy the joint is 
       j.frequencyHz = props.frequency||0;  // Try a value less than 5 (0 for no elasticity)
       j.dampingRatio = props.damping||1; // Ranges between 0 and 1 (1 for no springiness)
       if (props.xy != undefined) j.localAnchorA = b2scaleTo(props.xy);
    } else if (type=='pulley') {
    	j = new box2d.b2PulleyJointDef();
        // Connection between previous and this one
       j.bodyA = bodyA.body;
       j.bodyB = bodyB.body;
       j.groundAnchorA = b2scaleTo(props.xy);
       j.groundAnchorB = b2scaleTo(props.xyb);
       j.lengthA = props.lengthA/b2scaleFactor;
       j.lengthB = props.lengthB/b2scaleFactor;
       j.ratio = props.ratio;
    } else if (type=='rope') {
    	j = new box2d.b2RopeJointDef();
        // Connection between previous and this one
       j.bodyA = bodyA.body;
       j.bodyB = bodyB.body;
       // Equilibrium length
       j.maxLength = props.separation/b2scaleFactor;
       if (props.xy != undefined) j.localAnchorA = b2scaleTo(props.xy);
    } else if (type=='revolute') {
    	j = new box2d.b2RevoluteJointDef();
    	j.Initialize(bodyA.body, bodyB.body, props.xy == undefined?bodyA.body.GetWorldCenter():b2scaleTo(props.xy));
    	j.motorSpeed = props.speed||0;       // how fast?
        j.maxMotorTorque = props.maxTorque||0; // how powerful?
        j.enableMotor = props.enable||false;      // is it on?
    } else if (type=='mouse') {
    	j = new box2d.b2MouseJointDef();
        j.bodyA = bodyA!=null?bodyA.body:b2world.CreateBody(new box2d.b2BodyDef());
        j.bodyB = bodyB.body;
        j.target = b2scaleTo(props.xy);
        j.collideConnected = true;
        j.maxForce = props.maxForce||(1000.0 * bodyB.body.GetMass());
        j.frequencyHz = props.frequency||5;  // Try a value less than 5 (0 for no elasticity)
        j.dampingRatio = props.damping||0.9; // Ranges between 0 and 1 (1 for no springiness)
        bodyB.body.SetAwake(true);
        bodyA=bodyB;
    }
    j = b2world.CreateJoint(j);
    bodyA.joints.push(j);
    return j;
}
function b2Body(type, dynamic, xy, wh, /*optional*/den,fric,bounce,angle) {
    this.body = new box2d.b2BodyDef();
    this.body.type = 
     dynamic?box2d.b2BodyType.b2_dynamicBody:box2d.b2BodyType.b2_staticBody;
    var t = b2scaleTo(xy);
    this.body.position.x = t.x;
    this.body.position.y = t.y;
    if (arguments.length==4) {
      den=1; fric=0.5; bounce=0.2;
    }
    this.den=den;
    this.fric=fric;
    this.bounc=bounce;
    this.fixtures=[];
    this.joints=[];
    this.visible = true;
    this.life = 10000000;
    b2Count++;
    this.body = b2world.CreateBody(this.body);
    this.body.userData = this;
    this.AddTo(type,createVector(0,0),wh,angle);
    b2new.push(this);
    Object.defineProperties(this, {
        "density": {
            "get": function () {
                return this.den;
            },
            "set": function (x) {
                this.den = x;
                for (var i=0; i<fixtures.length; i++) this.fixtures[i].density=x;
                this.body.ResetMassData();
            }
        }
    });
    Object.defineProperties(this, {
        "friction": {
            "get": function () {
                return this.fric;
            },
            "set": function (x) {
                this.fric = x;
                for (var i=0; i<fixtures.length; i++) this.fixtures[i].friction=x;
            }
        }
    });
    Object.defineProperties(this, {
        "bounce": {
            "get": function () {
                return this.bounc;
            },
            "set": function (x) {
                this.bounce = x;
                for (var i=0; i<fixtures.length; i++) this.fixtures[i].restitution=x;
            }
        }
    });
    Object.defineProperties(this, {
        "xy": {
            "get": function () {
                return b2scaleFrom(this.body.GetPosition());
            },
            "set": function (x) {
                this.body.SetPosition(b2scaleTo(x));
            }
        }
    });
    Object.defineProperties(this, {
        "bullet": {
            "get": function () {
                return this.body.bullet;
            },
            "set": function (x) {
                this.body.SetBullet(x);
            }
        }
    });
    Object.defineProperties(this, {
        "velocity": {
            "get": function () {
                return b2scaleFrom(this.body.GetLinearVelocity());
            },
        }
    });
    Object.defineProperties(this, {
        "angle": {
            "get": function () {
                return this.body.GetAngleRadians();
            },
        }
    });
    Object.defineProperties(this, {
        "centerOfMass": {
            "get": function () {
                return b2scaleFrom(this.body.GetWorldCenter());
            },
        }
    });
    Object.defineProperties(this, {
        "mass": {
            "get": function () {
                return this.body.GetMass();
            },
        }
    });
    Object.defineProperties(this, {
        "classOf": {
            "get": function () {
                return 'b2Body';
            },
        }
    });
}
b2Body.prototype.AddTo = function(type,xy,wh,/*optional*/angle) {
    var t = b2scaleTo(wh);
    var fx = new box2d.b2FixtureDef();
    fx.image = null;
    fx.isCircle = type == 'circle';
    fx.xy = xy;
    fx.wh = wh;
    if (fx.isCircle) {
      fx.shape=new box2d.b2CircleShape(t.x/2);
      fx.shape.m_p = b2scaleTo(xy);
    } else {    
      fx.shape=new box2d.b2PolygonShape();
      if (Array.isArray(wh)) {
      	var vecs = [];
        for (var i = 0; i < wh.length; i++) {
          vecs[i] = b2scaleTo(wh[i]);
        }
        fx.shape.SetAsArray(vecs, vecs.length);
      } else
        fx.shape.SetAsOrientedBox(t.x/2, t.y/2, b2scaleTo(xy), angle||0);
    }
    fx.angle = angle||0;
    fx.density=this.den;
    fx.friction=this.fric;
    fx.restitution=this.bounc;
    fx.display = null;
    this.fixtures.push(fx);
    this.body.CreateFixture(fx);
    return fx;
}
b2Body.prototype.Destroy = function {
	this.body.SetActive(false);
}
b2Body.prototype.draw = function () {
    var pos=b2scaleFrom(this.body.GetPosition());
    if (pos.x<0 || pos.x>width) return true;
    if (pos.y>height) return true;
    if (this.life-- < 0) return true;
    if (!this.visible) return false;
    var a = this.angle;
    for (var i=0; i<this.fixtures.length; i++) {
    	if (this.fixtures[i].display!=null) {
        this.fixtures[i].display.call(null,this,this.fixtures[i],pos);
        continue;
      }
    push();
    var xy=this.fixtures[i].xy;
    translate(pos.x,pos.y);
    if (a != 0) 
      rotate(a);
    translate(xy.x,xy.y);
    if (this.fixtures[i].angle != 0) 
      rotate(this.fixtures[i].angle);
    xy=this.fixtures[i].wh;
    if (this.fixtures[i].image!=null) {
      image(this.fixtures[i].image,0,0,xy.x,xy.y);
    } else {
      fill(127);
      stroke(200);
      strokeWeight(2);
      if (this.isCircle(i)) ellipse(0, 0, xy.x, xy.x);
      else if (Array.isArray(xy)) {
      	beginShape();
        for (var i=0; i<xy.length; i++)
          vertex(xy[i].x, xy[i].y);
        endShape(CLOSE);
      } else rect(0, 0, xy.x, xy.y);
    }
    pop();
}
    return false;
}
var b2display = function(body, fixture, pos) {
     if (!body.visible) return;
     push();
    var xy=fixture.xy;
    var a=body.angle;
    translate(pos.x,pos.y);
    if (a != 0) 
      rotate(a);
    translate(xy.x,xy.y);
    if (fixture.angle != 0) 
      rotate(fixture.angle);
    xy=fixture.wh;
    if (fixture.image!=null) {
      image(fixtures.image,0,0,xy.x,xy.y);
    } else {
      if (fixture.isCircle) ellipse(0, 0, xy.x, xy.x);
      else if (Array.isArray(xy)) {
      	beginShape();
        for (var i=0; i<xy.length; i++)
          vertex(xy[i].x, xy[i].y);
        endShape(CLOSE);
      } else rect(0, 0, xy.x, xy.y);
    }
    pop();
}
var b2getBodyAt = function(x,y) {
   var mouseInWorld = b2scaleTo(createVector(x,y))
   var aabb = new box2d.b2AABB();
   aabb.lowerBound=new box2d.b2Vec2(mouseInWorld.x - 0.001, mouseInWorld.y - 0.001);
   aabb.upperBound=new box2d.b2Vec2(mouseInWorld.x + 0.001, mouseInWorld.y + 0.001);
   
   // Query the world for overlapping shapes.

   var selectedBody = null;
   b2world.QueryAABB(function(fixture) {
     if(fixture.GetBody().GetType() != box2d.b2BodyType.b2_staticBody) {
        if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mouseInWorld)) {
           selectedBody = fixture.GetBody();
           return false;
        }
     }
     return true;
   }, aabb);
   return selectedBody;
}

b2Body.prototype.isCircle = function (index) {
   return this.fixtures[index||0].isCircle; 
}
b2Body.prototype.destroyJoint = function (index) {
   var x = this.joints[index||0];
   this.joints.splice(index||0,1);
   b2world.DestroyBody(x.m_bodyA);
   b2world.DestroyJoint(x);
}
b2Body.prototype.image = function (image,index) {
   this.fixtures[index||0].image = image; 
}
b2Body.prototype.sensor = function (b,index) {
   this.fixtures[index||0].SetSensor(b); 
}
b2Body.prototype.display = function (func,index) {
   this.fixtures[index||0].display = func; 
}
b2Body.prototype.motorOn = function (on,index) {
   this.joints[index||0].EnableMotor(on); 
}
b2Body.prototype.isMotorOn = function (on,index) {
   this.joints[index||0].IsMotorEnabled(on); 
}
b2Body.prototype.motorSpeed = function (v,index) {
   this.joints[index||0].SetMotorSpeed(v);
}
b2Body.prototype.maxMotorTorque = function (v,index) {
   this.joints[index||0].SetMaxMotorTorque(v);
}
b2Body.prototype.getMotorSpeed = function (index) {
   return this.joints[index||0].GetMotorSpeed();
}
b2Body.prototype.getMaxMotorTorque = function (index) {
   return this.joints[index||0].GetMaxMotorTorque();
}
b2Body.prototype.setTarget = function (xy,index) {
   this.joints[index||0].SetTarget(b2scaleTo(xy));
}
b2Body.prototype.applyImpulse = function (xy,power) {
    xy.mult(power);
    this.body.ApplyLinearImpulse(new box2d.b2Vec2(xy.x,xy.y),this.body.GetWorldCenter());
}
b2Body.prototype.applyForce = function (xy,power) {
    xy.mult(power);
    this.body.ApplyForce(new box2d.b2Vec2(xy.x,xy.y),this.body.GetWorldCenter());
}
b2Body.prototype.applyTorque = function (x) {
    this.body.ApplyTorque(x);
}
b2Body.prototype.applyAngularImpulse = function (x) {
    this.body.ApplyAngularImpulse(x);
}
b2Body.prototype.toString = function () {
    var v = this.velocity;
    var xy = this.xy;
    return xy.x.toFixed() + '/' + xy.y.toFixed() + ' ' + v.x.toFixed() + '/' + v.y.toFixed();
}
// -----------------------------------------------------------------------------
// Draw Methods
// -----------------------------------------------------------------------------

var b2debugDraw = function(canvas, scale, world) {

	var context = canvas.getContext('2d');
  //context.fillStyle = '#DDD';
  //context.fillRect(0, 0, canvas.width, canvas.height);

	// Draw joints
	for(var j=world.m_jointList; j; j=j.m_next) {
    context.lineWidth = 0.25;
    context.strokeStyle = '#00F';
    drawJoint(context, scale, world, j);
  }

	// Draw body shapes
	for(var b=world.m_bodyList; b; b=b.m_next) {
		for(var f = b.GetFixtureList(); f!=null; f=f.GetNext()) {  
      context.lineWidth = 0.5;
			context.strokeStyle = '#F00';
      drawShape(context, scale, world, b, f);
    }
  }
}

var drawJoint = function(context, scale, world, joint) {
	context.save();
  context.scale(scale,scale);
  context.lineWidth /= scale;

  var b1 = joint.m_bodyA;
  var b2 = joint.m_bodyB;
  var x1 = b1.GetPosition();
  var x2 = b2.GetPosition();
  var p1;
  var p2;

  context.beginPath();
  switch (joint.m_type) {
    case box2d.b2JointType.e_distanceJoint:
    case box2d.b2JointType.e_ropeJoint:
      context.moveTo(x1.x, x1.y);
      context.lineTo(x2.x, x2.y);
      break;
    case box2d.b2JointType.e_mouseJoint:
      var p1 = joint.GetAnchorA();
      var p2 = joint.GetAnchorB();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      break;
    case box2d.b2JointType.e_pulleyJoint:
      p1 = joint.m_groundAnchorA;
      p2 = joint.m_groundAnchorB;
      context.moveTo(p1.x, p1.y);
      context.lineTo(x1.x, x1.y);
      context.moveTo(p2.x, p2.y);
      context.lineTo(x2.x, x2.y);
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      break;
    default: {
      /*if (b1 == world.m_groundBody) {
        context.moveTo(p1.x, p1.y);
        context.lineTo(x2.x, x2.y);
      }
      else if (b2 == world.m_groundBody) {
        context.moveTo(p1.x, p1.y);
        context.lineTo(x1.x, x1.y);
      }
      else {
        context.moveTo(x1.x, x1.y);
        context.lineTo(p1.x, p1.y);
        context.lineTo(x2.x, x2.y);
        context.lineTo(p2.x, p2.y);
      }*/
    } break;
  }
  context.closePath();
  context.stroke();
  context.restore();
}

var drawShape = function(context, scale, world, body, fixture) {

  context.save();
  context.scale(scale,scale);

  var bPos = body.GetPosition();
  context.translate(bPos.x, bPos.y);
  context.rotate(body.GetAngleRadians());
  
  context.beginPath();
  context.lineWidth /= scale;

	var shape = fixture.m_shape;
  switch(shape.m_type) {
    case box2d.b2ShapeType.e_circleShape: {
      var r = shape.m_radius;
      var segments = 16.0;
      var theta = 0.0;
      var dtheta = 2.0 * Math.PI / segments;
      context.translate(shape.m_p.x, shape.m_p.y); /*RPC*/
      context.moveTo(r, 0);
      for (var i = 0; i < segments; i++) {
        context.lineTo(/*RPC r+*/r * Math.cos(theta), r * Math.sin(theta));
        theta += dtheta;
      }
      context.lineTo(r, 0);
    } break;

    case box2d.b2ShapeType.e_polygonShape:
    case box2d.b2ShapeType.e_chainShape: {

      var vertices = shape.m_vertices;
      var vertexCount = shape.m_count;
      if (!vertexCount) return;
      //context.translate(shape.m_centroid.x, shape.m_centroid.y); /*RPC*/
      context.moveTo(vertices[0].x, vertices[0].y);
      for (var i = 0; i < vertexCount; i++)
        context.lineTo(vertices[i].x, vertices[i].y);
    } break;
  }

  context.closePath();
  context.stroke();
  context.restore();
}
