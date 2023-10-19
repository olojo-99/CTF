
// World must define these: 
const       CLOCKTICK   = 100;                  // speed of run - move things every n milliseconds -> 100
const       MAXSTEPS    = 500;                  // length of a run before final score -> 1000
const       POS = 0
 
const  SCREENSHOT_STEP = 50;    
 
 
//---- global constants: -------------------------------------------------------
const gridsize = 30;                        // number of squares along side of world       
const NOBOXES =  Math.trunc ( (gridsize * gridsize) / 10 );
        // density of maze - number of internal boxes
        // (bug) use trunc or can get a non-integer 

const squaresize = 100;                 // size of square in pixels
const MAXPOS = gridsize * squaresize;       // length of one side in pixels 
    
const SKYCOLOR  = 0xF0B27A  ;               // a number, not a string 
const BLANKCOLOR    = SKYCOLOR ;            // make objects this color until texture arrives (from asynchronous file read)
const LIGHTCOLOR    = 0xffffff ;

const show3d = true;                        // Switch between 3d and 2d view (both using Three.js) 
 
const startRadiusConst      = MAXPOS * 0.8 ;        // distance from centre to start the camera at
const skyboxConst           = MAXPOS * 3 ;      // where to put skybox  
const maxRadiusConst        = MAXPOS * 10  ;      // maximum distance from camera we will render things 


//--- Mind can pick one of these actions -----------------
const ACTION_LEFT       = 0;           
const ACTION_RIGHT      = 1;
const ACTION_UP         = 2;         
const ACTION_DOWN       = 3;
const ACTION_STAYSTILL  = 4;
const ACTION_SAUL       = 6;
const ACTION_PAUSE      = 7;

// in initial view, (smaller-larger) on i axis is aligned with (left-right)
// in initial view, (smaller-larger) on j axis is aligned with (away from you - towards you)

// contents of a grid square
const GRID_BLANK    = 0;
const GRID_WALL     = 1;
const GRID_MAZE     = 2;
 
// --- some useful random functions  -------------------------------------------
function randomfloatAtoB ( A, B )            
{
 return ( A + ( Math.random() * (B-A) ) );
}

function randomintAtoB ( A, B )          
{
 return  ( Math.round ( randomfloatAtoB ( A, B ) ) );
}
  
function randomBoolean()             
{
 if ( Math.random() < 0.5 ) { return false; }
 else { return true; }
}
//------------------------------------------------------------------------------

//--------------------- start of World class -----------------------------------
function World() {

var BOXHEIGHT;      // 3d or 2d box height 
var GRID    = new Array(gridsize);          // can query GRID about whether squares are occupied, will in fact be initialised as a 2D array   
var WALLS   = new Array ( 4 * gridsize );       // need to keep handles to wall and maze objects so can find them later to paint them 
var MAZE    = new Array ( NOBOXES );
var theagent, theenemy;                //People moving. User is the agent
var hat;                             //Aim of the game is to get as many hats as possible before being caught.
var bed;
var fan;
var secret = false;
var music = false;

//position on squares
var ei, ej, ai, aj;   //enemy and agent
var fi, fj;          //hat

//var badsteps;
//var goodsteps;
var step;
var hats;  //keeps track of how many hats you find.
var self = this;                        // needed for private fn to call public fn - see below 

//---------------------- Grid -------------------------------------------------------------
function initGrid(){
 for (var i = 0; i < gridsize ; i++) {
  GRID[i] = new Array(gridsize);        // each element is an array 
  for (var j = 0; j < gridsize ; j++) {
   GRID[i][j] = GRID_BLANK ;
  }
 }
}


function occupied ( i, j )      // is this square occupied
{
 if ( ( ei == i ) && ( ej == j ) ) return true;     // variable objects 
 if ( ( ai == i ) && ( aj == j ) ) return true;
 if ( ( fi == i ) && ( fj == j ) ) return true;     //make sure hat is not placed on piece of maze.
 if ( GRID[i][j] == GRID_WALL ) return true;        // fixed objects     
 if ( GRID[i][j] == GRID_MAZE ) return true;         
     
 return false; // otherwise the square is not occupied
}

// logically, coordinates are: y=0, x and z all positive (no negative)    
// logically my dimensions are all positive 0 to MAXPOS
// to centre everything on origin, subtract (MAXPOS/2) from all dimensions 

function translate ( x ) 
{
 return ( x - ( MAXPOS/2 ) );
}
    
// --- asynchronous load textures from file ----------------------------------------

// First textures load when game starts up first.  
// CHANGE TEXTURES
function loadTexturesFIRST()
{
    var manager = new THREE.LoadingManager();
    var loader = new THREE.OBJLoader( manager );
    
  loader.load( "/uploads/indy/18827_Soldier_firing_an_uzi_held_at_his_side_v1.obj", buildenemy );

  loader.load( "/uploads/indy/18827_Soldier_firing_an_uzi_held_at_his_side_v1.obj", buildagent);
 
  loader.load( "/uploads/indy/18456_Cowboy_Hat_new.obj", buildhat); 
  
  loader.load( "/uploads/indy/10273_Ceiling_Fan_v4_iterations-2.obj", buildFan);
  
  loader.load( "/uploads/indy/uploads_files_4090181_lowpolybed.obj", buildBed);
    
 var loader1 = new THREE.TextureLoader();
 loader1.load ( '/uploads/indy/1669575548.png',     function ( thetexture ) {            
        thetexture.minFilter = THREE.LinearFilter;
        paintWalls ( new THREE.MeshBasicMaterial( { map: thetexture } ) );
    } ); 

}

//Second textures are for when the hat is found and reloads maze and new hat position
function loadTexturesSECOND()
{
    var manager = new THREE.LoadingManager();
    var loader = new THREE.OBJLoader( manager );
    
    loader.load( "/uploads/indy/18456_Cowboy_Hat_new.obj", buildhat);
    
 var loader1 = new THREE.TextureLoader();
 loader1.load ( '/uploads/indy/1669575548.png',     function ( thetexture ) {            
        thetexture.minFilter = THREE.LinearFilter;
        paintWalls ( new THREE.MeshBasicMaterial( { map: thetexture } ) );
    } );

}

// --- build and paint ---------------------------------------- 
   
 function buildenemy ( object ) { 
    object.scale.multiplyScalar ( 30 );       // make 3d object n times bigger 
    object.traverse( paintEnemy );
    theenemy = object;
    threeworld.scene.add( theenemy ); 
}

function paintEnemy ( child ) {
    if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( "/uploads/indy/1670246833.png" );
    }
}


 function buildagent ( object ) { 
    object.scale.multiplyScalar ( 30 );       // make 3d object n times bigger 
    object.traverse( paintAgent );
    theagent = object;
    threeworld.scene.add( theagent ); 
}

function paintAgent ( child ) {
    if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( "/uploads/indy/1670246793.png" );
    }
}


 function buildhat ( object ) { 
    object.scale.multiplyScalar ( 5 );        // make 3d object n times bigger 
    object.traverse( painthat );
    hat = object;
    threeworld.scene.add( hat ); 
}

// CHANGE TO HAT
function painthat ( child ) {
    if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( "/uploads/indy/1670174773.png" );
    }
}


//--- skybox ----------------------------------------------------------------------------------------------
// CHANGE TO ANDY'S ROOM
function initSkybox() 
{
  var materialArray = [                                                                                                                 // from starting position
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/andys-wall.jpg" ), side: THREE.BackSide } ) ), // right
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/andys-window1.jpg" ), side: THREE.BackSide } ) ), // left face
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/andysroomceiling.jpg" ), side: THREE.BackSide } ) ), // ceiling
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/andys-floor.jpg" ), side: THREE.BackSide } ) ), // floor
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/andys-door.jpg" ), side: THREE.BackSide } ) ), // back
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/posterwall.png" ), side: THREE.BackSide } ) ) // front
    ];

  var skyGeometry = new THREE.CubeGeometry ( skyboxConst, skyboxConst, skyboxConst );   
  var skyMaterial = new THREE.MeshFaceMaterial ( materialArray );
  var theskybox = new THREE.Mesh ( skyGeometry, skyMaterial );
  threeworld.scene.add( theskybox );    // We are inside a giant cube
}

function initsecret() 
{
  var materialArray = [                                                                                                                 // from starting position
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/1663672177.png" ), side: THREE.BackSide } ) ), // right
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/1663672177.png" ), side: THREE.BackSide } ) ), // left face
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/1663672177.png" ), side: THREE.BackSide } ) ), // ceiling
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/1663672177.png" ), side: THREE.BackSide } ) ), // floor
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/1663672177.png" ), side: THREE.BackSide } ) ), // back
    ( new THREE.MeshBasicMaterial ( { map: THREE.ImageUtils.loadTexture( "/uploads/indy/1663672177.png" ), side: THREE.BackSide } ) ) // front
    ];

  var skyGeometry = new THREE.CubeGeometry ( skyboxConst, skyboxConst, skyboxConst );   
  var skyMaterial = new THREE.MeshFaceMaterial ( materialArray );
  var theskybox = new THREE.Mesh ( skyGeometry, skyMaterial );
  threeworld.scene.add( theskybox );    // We are inside a giant cube
}

//------------------- Walls surrounding grid ---------------------------------------------
function initLogicalWalls()     // set up logical walls in data structure, whether doing graphical run or not   
{
 for (var i = 0; i < gridsize ; i++) 
  for (var j = 0; j < gridsize ; j++) 
   if ( ( i===0 ) || ( i===gridsize-1 ) || ( j===0 ) || ( j===gridsize-1 ) ){
        GRID[i][j] = GRID_WALL ;         
   }
}

// CHANGE WALL INITIALISING FUNCTION
function initThreeWalls()       // graphical run only, set up blank boxes, painted later    
{
 var t = 0;
 for (var i = 0; i < gridsize ; i++) 
  for (var j = 0; j < gridsize ; j++) 
   if ( GRID[i][j] == GRID_WALL )
   {
     var shape    = new THREE.BoxGeometry( squaresize, BOXHEIGHT, squaresize );          
     var thecube  = new THREE.Mesh( shape );
     thecube.material.color.setHex( BLANKCOLOR  );            
 
         thecube.position.x = translate ( i * squaresize );         // translate my simple (i,j) block-numbering coordinates to three.js (x,y,z) coordinates 
         thecube.position.z = translate ( j * squaresize );     
         thecube.position.y =  -BOXHEIGHT - POS;
 
     threeworld.scene.add(thecube);
     WALLS[t] = thecube;                // save it for later
     t++; 
   }
   else{
     var tile     = new THREE.BoxGeometry( squaresize, 0, squaresize );          
     var theTile  = new THREE.Mesh( tile );
     theTile.material.color.setHex( BLANKCOLOR  );
     theTile.material.map = THREE.ImageUtils.loadTexture('/uploads/indy/1669575548.png');

 
         theTile.position.x = translate ( i * squaresize );         
         theTile.position.z = translate ( j * squaresize );     
         theTile.position.y =  -BOXHEIGHT/2 - POS;
         
 
     threeworld.scene.add(theTile);
     GRID[i][j] = theTile
   }
}

function paintWalls ( material )         
{
 for ( var i = 0; i < WALLS.length; i++ )
 { 
   if ( WALLS[i] )  WALLS[i].material = material;
 }
}

// ---------------------------


//---------------Shapes Functions----------------------- -------------------------------------------------------------------------------------------

function initThreeBox(zpos, xpos)
{

     var box     = new THREE.BoxGeometry( squaresize * 2, 4000, squaresize * 2);             
     var theBox  = new THREE.Mesh( box );
     theBox.material.color.setHex( BLANKCOLOR  );
     theBox.material.map = THREE.ImageUtils.loadTexture('/uploads/indy/1669575548.png');

 
     theBox.position.x = translate (squaresize * xpos);         
     theBox.position.z = translate (squaresize * zpos);     
     theBox.position.y =  -2000 - BOXHEIGHT - POS;
 
     threeworld.scene.add(theBox);

}

function buildFan(object)
{
    object.scale.multiplyScalar ( 30 );       // make 3d object n times bigger 
    object.traverse( paintFan );
    fan = object;
    
    fan.position.x = 0;
    fan.position.y = 3000 - POS;
    fan.position.z = 0;
    
    fan.rotation.x = 4.8
    threeworld.scene.add( fan );
}


function drawFan()
{
    fan.rotation.z += 0.2 % 1
}

function paintFan ( child ) {
    if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( "/uploads/indy/10273_Ceiling_Fan_v2_Diffuse.jpg" );
    }
}

function buildBed(object)
{
    object.scale.multiplyScalar ( 1000 );         // make 3d object n times bigger 
    object.traverse( paintBed );
    bed = object;
    
    bed.position.x = -1500;
    bed.position.y = -4000 - POS;
    bed.position.z = -3000;
    
    bed.rotation.y = 1.55
    threeworld.scene.add( bed );
}


function paintBed ( child ) {
    if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( "/uploads/indy/bed_individual_diffuse_bi.jpg" );

    }
}

//----------------- Maze within the walls of the grid, only appears after catching first hat -----------
function initLogicalMaze()       
{ 
 for ( var c=1 ; c <= 10 ; c++ )
 {
    var i = randomintAtoB(1,gridsize-3);    // inner squares are 1 to gridsize-2 
    var j = randomintAtoB(1,gridsize-2);    
    GRID[i][j] = GRID_MAZE ;         
 }
}

// CHANGE VARIABLES IN ConeGeometry
function initThreeMaze()            
{
 var t = 0;
 for (var i = 0; i < gridsize ; i++) 
  for (var j = 0; j < gridsize ; j++) 
   if ( GRID[i][j] == GRID_MAZE )
   {
    var shape    = new THREE.BoxGeometry( squaresize, BOXHEIGHT, squaresize );   // create cone object   
    var thecube  = new THREE.Mesh( shape );
    thecube.material.map = THREE.ImageUtils.loadTexture('/uploads/indy/1670271734.png');
    //thecube.material.color.setHex( 0x9f9292  );             

    thecube.position.x = translate ( i * squaresize );      
    thecube.position.z = translate ( j * squaresize );      
    thecube.position.y =  - POS;    
 
    threeworld.scene.add(thecube);
    MAZE[t] = thecube;      // set maze postion to 
    t++; 
   }
}

function paintMaze ( material )      
{
 for ( var i = 0; i < MAZE.length; i++ )
 { 
   if ( MAZE[i] )  MAZE[i].material = material;
 }
}


// ---------------------------

// CREATE OBJECT HOVER FUNCTION

// ---------------------------

//------------------------- hat functions ----------------

function drawhat()  // given fi, fj, draw hat
{
if( hat ){
  var x = translate ( fi * squaresize );    
  var z = translate ( fj * squaresize );        
  var y = ( -1 * squaresize + 60 );

 hat.position.x = x;
 hat.position.y = 10 - POS;
 hat.position.z = z;
 
 hat.rotation.z += 0.2 % 1
 hat.rotation.x = 4.8

 threeworld.lookat.copy ( hat.position );       // if camera is moving, look back at where the enemy is  
 threeworld.lookat.y = (squaresize * 1.5 );
 }
}

function initLogicalhat(){       
// start in random location:
 var i, j;
 do
 {
    i = randomintAtoB(1,gridsize-2);
    j = randomintAtoB(1,gridsize-2); 
 }
 while ( occupied(i,j) );     // search for empty square for hat

 fi = i;
 fj = j;
}
 
// --- enemy functions -----------------------------------
function drawEnemy()    // given ei, ej, draw it 
{
    if ( theenemy ) {
      var x = translate ( ei * squaresize );    
      var z = translate ( ej * squaresize );    
      var y = ( -1 * squaresize ) ;
  
     theenemy.position.x = x;
     theenemy.position.y = y + 50 - POS;
     theenemy.position.z = z;
     
     theenemy.rotation.x = 4.8;


     threeworld.lookat.copy ( theenemy.position );      // if camera moving, look back at where the enemy is  
     threeworld.lookat.y = ( squaresize * 1.5 );
    }
}


function initLogicalEnemy()
{
// start in corner of grid.
 var i, j;
 do
 {
  i = 1;
  j = 1;
 }
 while ( occupied(i,j) );     // search for empty square 

 ei = i;
 ej = j;
}

function moveLogicalEnemy()
{
// move towards agent including diagonal moves
     var i, j;
     if ( ei < ai ) i = ei+1;
     else if ( ei == ai ) i = ei; 
     else i = ei-1;
    
     if ( ej < aj ) j = ej+1;
     else if ( ej == aj ) j = ej; 
     else j = ej-1;
     
     if ( ! occupied(i,j) )     // if no obstacle then move, else just miss a turn
     {
      ei = i;
      ej = j;
     }
}


// --- agent functions -----------------------------------
function drawAgent()    // given ai, aj, draw it 
{
  if( theagent ){   
  var x = translate ( ai * squaresize );    
  var z = translate ( aj * squaresize );        
  var y = ( -1 * squaresize );

 theagent.position.x = x;
 theagent.position.y = y + 50 - POS;
 theagent.position.z = z;
 
 theagent.rotation.x = 4.8
  theagent.rotation.z = 9

 threeworld.follow.copy ( theagent.position );      // follow vector = agent position (for camera following agent)
 threeworld.follow.y = ( squaresize * 1.5 );
 }
}


function initLogicalAgent()
{
// start at opposite side of grid than enemy 
 var i, j;
 do
 {
  i = 28;
  j = 28;
 }
 while ( occupied(i,j) );     // search for empty square 

 ai = i;
 aj = j;
}

function moveLogicalAgent( a )          // this is called by the infrastructure that gets action a from the Mind 
{ 
 var i = ai;
 var j = aj;         

      if ( a == ACTION_LEFT )   i--;
 else if ( a == ACTION_RIGHT )  i++;
 else if ( a == ACTION_UP )         j++;
 else if ( a == ACTION_DOWN )   j--;
 else if ( a == ACTION_SAUL)
 {
     if ( secret === false){
       initsecret();
       musicPause();
       initSecretMusic();
       
       secret = true;
     }
     
     else{
         initSkybox();
         secretPause();
         initMusic();
         
        secret = false;
     }
 }
 else if ( a == ACTION_PAUSE){
     if (music === true){
         if (secret === true)
         {
            secretPause()
         }
         else
         {
            musicPause()
         }
         music = false
         
     }
     else{
         if (secret === true)
         {
            secretPlay()
         }
         else
         {
            musicPlay()
         }
         music = true

     }
 }

 if ( ! occupied(i,j) ) 
 {
  ai = i;
  aj = j;
 }
}

//---------------- User will control the agent -------------------
function keyHandler(e)      
// user control 
{
    if(oppActive){
    if (e.keyCode == 37)  moveLogicalAgent ( ACTION_LEFT    );
    else if (e.keyCode == 38)  moveLogicalAgent ( ACTION_DOWN   );
    else if (e.keyCode == 39)  moveLogicalAgent ( ACTION_RIGHT  );
    else if (e.keyCode == 40)  moveLogicalAgent ( ACTION_UP  );
    else if (e.keyCode == 17)  moveLogicalAgent ( ACTION_PAUSE      ); // ctrl to mute
    else if (e.keyCode == 27)  moveLogicalAgent ( ACTION_SAUL   ); // esc for surprise
    }
}


// agent is blocked on all sides, run over
function agentBlocked()         
{
 return (   occupied (ai-1,aj)      
                && 
        occupied (ai+1,aj)      
                &&
        occupied (  ai,aj+1)        
                &&
        occupied (  ai,aj-1)    );      
} 

// if agent is caught by enemy. Run over.
function agentCaught(){
    
    return(ai == ei+1 && aj == ej
            || ai == ei && aj == ej+1 
            || ai == ei-1 && aj == ej 
            || ai == ei && aj == ej-1 
            || ai == ei-1 && aj == ej-1 
            || ai == ei+1 && aj == ej+1 );
}

/* When agent finds a hat.
That hat is removed and created in a new random place.
More of the maze is added in to make it more difficult for the user.
*/
function capturehat(){
       if(ai == fi && aj == fj 
          || ai == fi+1 && aj == fj
          || ai == fi && aj == fj+1
          || ai == fi-1 && aj == fj
          || ai == fi && aj == fj-1){
                threeworld.scene.remove(hat);
                hats++;
                
                // use AB library for WebSocket Communication
                AB.socketOut(hats); // send update for number of hats caught to the other user's world

                initLogicalhat();
                initLogicalMaze();
                initThreeMaze();
                loadTexturesSECOND();   
       }
}

//------------- Status ----------

function updateStatus(oppScore)
// update status to show old state and proposed move 
{
  var playerhat = "<br><b> Your score is: </b>   " + hats + "<br>";
  var opponenthat = "<b>Your opponent's score is: </b>   " + oppScore + "<br>";
 $("#user_span3").html( "<br> Press Ctrl to Mute <br> Press Esc for a Surprise <br>");
 $("#user_span4").html( playerhat );
 $("#user_span5").html( opponenthat );
 $("#user_span6").html( "<br><h3 style='color:#005164;'> GAME CHAT </h3>" );
}

//--- public functions / interface / API ----------------------------------------------------------

this.endCondition;          // If set to true, run will end. 
var runOver = false; // time elapsed for game has reached max amount
var oppActive = false; // tracking if opponent is in game
var opponentCaught = false; // variable to keep track of whether opponent is still active
var opponentScore = 0; // variable to keep track of opponent's score

this.newRun = function() {
  this.endCondition = false;

    // user list functionality for updating html
    AB.socketUserlist = function ( array ){
        if (array.length > 1){
            oppActive = true;
            step = 0;
            hats = 0;
        
            $("#user_span9").html( "" ); // empty string
            $("#user_span8").html( '<br> <INPUT style="width:20vw" id=me ><button onclick="sendchat()" class=ab-normbutton > Send </button> <br>' )
            document.getElementById('me').onkeydown   = function(event)     { if (event.keyCode == 13)  sendchat(); }; // Enter also submits chat msg
        }

        else{
            $("#user_span9").html( "<br> <font color=goldenrod> <B> Waiting for opponent to join </B> </font>" )
        }
    }

 // for all runs:
    initGrid();
    initLogicalWalls();
    initLogicalhat();
    initLogicalAgent();
    initLogicalEnemy();

 // for graphical runs only:

  if ( true ){
    if ( show3d ){
     BOXHEIGHT = squaresize;

     threeworld.init3d ( startRadiusConst, maxRadiusConst, SKYCOLOR  ); 
     var ambient = new THREE.AmbientLight();
     threeworld.scene.add( ambient );
    }        
    
    else{
     BOXHEIGHT = 1;
     threeworld.init2d ( startRadiusConst, maxRadiusConst, SKYCOLOR  );              
    }

    initSkybox();
//      initMusic(); // play music

    initThreeWalls();
    
    //table legs
    initThreeBox(1,1);
    initThreeBox(1,gridsize - 2)
    initThreeBox(gridsize - 2, 1)
    initThreeBox(gridsize - 2,gridsize - 2)
    initThreeMaze();

    loadTexturesFIRST();
    document.onkeydown = keyHandler;
  }
};

this.nextStep = function()       
{
    // if opponent is active
    if (oppActive){
        step++;
        updateStatus(opponentScore);
        capturehat();

    // set speed of enemy bot
      if ( ( step % 5 ) === 0 )     // slow the enemy down to every nth step
        moveLogicalEnemy();
    }
    

    if ( true ){
        // draw 3d models
        drawAgent();
        drawEnemy();
        drawhat();
        drawFan()
    }


  if ( agentBlocked() )         // if agent blocked in, run over 
  {
    this.endCondition = true;
    if ( true  ){
     musicPause();
     soundAlarm();
    }
  }
  
  if( agentCaught()){
        this.endCondition = true;
        
        if ( true  ){
         musicPause();
         soundAlarm();
        }
  }
  
  if (step == MAXSTEPS){
    runOver = true; // the run is over due to time limit
    this.endCondition = true; // trigger end of game
  }
  
  if( opponentCaught ){
      this.endCondition = true; // end game with auto win since opponent is caught
  }
};

AB.socketIn = function ( data ){
    if (data == "captured"){
        opponentCaught = true; // update variable since opponent is caught
    }
    
    // if not captured status then data is opponents score
    else if ( Number.isInteger(data) ){
    opponentScore++; // increase opponents score
    }
    
    // opponent's message otherwise
    else{
        $("#user_span7").html( data.username + " says: " + data.line );
        
        if (data.username != "none")
        $("#user_span7").html("<B>" + data.username + " says: </B>" + data.line + "<br>" );
        
        else
        {$("#user_span7").html( "<B> Opponent says: </B>" + data.line + "<br>");}
    }
}

// Function to run when a plays game has ended
// Use WebSockets to inform other user game has ended
this.endRun = function(){
 if ( true  ){
     
    // pause music that is playing
    if (secret){
        secretPause();
    }
    else{
        musicPause();
    }
 
  if ( this.endCondition && runOver){
    if (hats > opponentScore){
        winMusic();
        $("#user_span9").html( "<br> <font color=green> <B> Time's up soldier. You Won </B> </font>   "   )
    }
    else if ((hats < opponentScore)){
        loseMusic();
        $("#user_span9").html( "<br> <font color=red> <B> Time's up soldier. You Lost </B> </font>   "   )
    }
    else{
        drawMusic();
        $("#user_span9").html( "<br> <font color=blue> <B> Time's up soldier. You Drew </B> </font>   "   )
    }
  }

  else if ( this.endCondition && opponentCaught){
      winMusic();
    $("#user_span9").html( "<br> <font color=green> <B> Your opponent was captured. You Win </B> </font>   "   )}

  else if ( this.endCondition ){
      // Alarm sounds
    AB.socketOut("captured"); // the user running the game has been captured, alert other user
    $("#user_span9").html( "<br> <font color=red> <B> You have been caught by the enemy. You Lose </B> </font>   "  )}

 }
};


}

AB.newSplash();                   
  
AB.splashHtml (
` <h1 style='color:#005164'> FIND WOODY'S  HAT </h1>  
    Andy's Bucket O' Soldiers are competing to find Woody's hat  <br>
    To play, create a password for your game and instruct your competitor to enter your password <br>
    Use the arrow keys to catch more of Woody's hats than your competitor while avoiding the enemy soldier and obstacles <br>
    But be careful! If you are captured by the enemy soldier you forfeit the game to your competitor
    <p>
    Enter password: 
    <input    style='width:25vw;'    maxlength='2000'   NAME="p"    id="p"       VALUE='' >  
    <button onclick='start();'  class=ab-normbutton >Start</button>
    <p>  
    <div id=errordiv name=errordiv> </div>
    <video width="320" height="240" controls>
      <source src="/uploads/indy/cutscene.mp4" type="video/mp4">
    </video>
    
    `
);

function start()        // user has entered a password 
{
    var  password =  jQuery("input#p").val();
    password = password.trim();
    
    if ( ! alphanumeric ( password ) )
    {
        $("#errordiv").html( "<font color=red> <B> Error: Password must be alphanumeric. </b></font> " );
        return;
    }
    
    // else we have a password, start the socket run with this password 
    AB.socketStart ( password );
    
    AB.removeSplash();
    
    initMusic(); // start music
}


function alphanumeric ( str )               // return if string is just alphanumeric   
{
    var rc = str.match(/^[0-9a-zA-Z]+$/);           // start of line  "[0-9a-zA-Z]+"  end of line 
    
    if ( rc ) return true;
    else      return false; 
}

function sendchat()
{
  var theline = $("#me").val();
  
  var info = 
  {
    userid:     AB.myuserid,
    username:   AB.myusername,
    line:       theline
  };
  
  AB.socketOut ( info );        // server gets this, and sends the data to all clients running this World
}

//---- end of World class -------------------------------------------------------


// --- music and sound effects ----------------------------------------

// CHANGE MUSIC AND SOUND EFFECTS

//playing in background
function initMusic()
{
    // put music element in one of the spans
    var x = "<audio  id=theaudio  src=/uploads/indy/RandyNewman-YouveGotaFriendinMeFromToyStory4_AudioOnly_Lyrics320kbps.mp3   autoplay loop> </audio>" ;
    $("#user_span1").html( x );
}

function initSecretMusic()
{
    // put music element in one of the spans
    var x = "<audio  id=secretaudio  src=/uploads/indy/Better-Call-Saul-Little-Barrie-Theme-Song.mp3   autoplay loop> </audio>" ;
    $("#user_span13").html( x );

} 

 function musicPlay()  
 {
//  // jQuery does not seem to parse pause() etc. so find the element the old way:
    document.getElementById('theaudio').play();
 }

function musicPause() 
{
    document.getElementById('theaudio').pause();
}

function secretPause() 
{
    document.getElementById('secretaudio').pause();
}

 function secretPlay()  
 {
    document.getElementById('secretaudio').play();
}

//When game over
function soundAlarm()
{
    var x = "<audio    src=/uploads/indy/dank-meme-compilation-volume-17_cutted.mp3   autoplay  > </audio>";
    $("#user_span2").html( x );
}

function drawMusic()
{
    var x = "<audio    src=/uploads/olojob2/clashRoyaleDraw.mp3   autoplay  > </audio>";
    $("#user_span10").html( x );
}

function winMusic()
{
    var x = "<audio    src=/uploads/olojob2/yay.mp3   autoplay  > </audio>";
    $("#user_span11").html( x );
}

function loseMusic()
{
    var x = "<audio    src=/uploads/olojob2/losing-horn.mp3   autoplay  > </audio>";
    $("#user_span12").html( x );
}
