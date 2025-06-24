const socket = io();
const joinBtn = document.getElementById("joinBtn");
let roomId = null;


window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get('room');
  if (roomFromUrl) {
    document.getElementById('roomInput').value = roomFromUrl.toUpperCase();
  }
});

joinBtn.addEventListener ("click",()=>{
  

   roomId = document.getElementById("roomInput").value.trim();
  if (!roomId) {
    // Generate random room ID if not entered
    roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    alert("Created Room: " + roomId);
  }

  const  url  = new URL(window.location);
  url.searchParams.set("roomId", roomId);
window.history.replaceState(null, null, url.toString());

     document.getElementById('roomMenu').style.display = 'none';
    //redirecting   to game.html
    window.location.href = `game.html?room=${roomId}`;
    
  });
