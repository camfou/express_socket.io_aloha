(function(w){

  var socket = io.connect('//localhost')
    , bindEvent = function(elem ,evt,cb) {
      	if ( elem.addEventListener ) {
      		elem.addEventListener(evt,cb,false)
      	} else if ( elem.attachEvent ) {
      		elem.attachEvent('on' + evt, function(){
                   cb.call(event.srcElement,event)
      		})
      	}
      }
	, unbindEvent = function(elem ,evt,cb) {
      	if ( elem.removeEventListener ) {
      		elem.removeEventListener(evt,cb,false)
      	} else if ( elem.detachEvent ) {
      		elem.detachEvent('on' + evt, function(){
                   cb.call(event.srcElement,event)
      		})
      	}
      }
	, scriptsLoaded = false
	, menuElements
	, idTab = []
	, currentPage = 'index'

  socket.emit('requestPage',{pageId:currentPage}) 

	if (window.Aloha === undefined || window.Aloha === null) {
		var Aloha = window.Aloha = {};
	}

	Aloha.settings = {
		locale: 'en',
		repositories: {
		linklist: {
		data: [
		{ name: 'Example', url:'http://example.com', type:'website', weight: 0.50 }
		]
		}
		},
		plugins: {
		load: 'common/ui, common/format, common/link',
		format: {
		config : [ 'b', 'i', 'p', 'h1', 'h2', 'h3', 'pre', 'removeFormat' ],
		}
		}
	}

  
  socket.on('loadPage', function (data) {
	currentPage = data.pageId
	var editables = document.getElementsByClassName('editable')
	for (var i = 0, max = editables.length; i < max; i++) {
		editables[i].innerHTML = data[editables[i].id]
	    idTab[editables[i].id] =data[editables[i].id+'Id']
	}    
  })

  socket.on('loadPageFailed', function (data) {
	var editables = document.getElementsByClassName('editable')
	for (var i = 0, max = editables.length; i < max; i++) {	
	   editables[i].innerHTML = '404 - '+data.name
	}
  })

  
  startAloha = function(){
	require({
		context: 'aloha',
		baseUrl: '/js'
		}, ['aloha'], function (Aloha) {
		Aloha.ready(function () {			
		  var editables = Aloha.jQuery('.editable')
			,sideBarElts = document.getElementsByClassName('aloha-ui')
		  for (var i = 0, max = sideBarElts.length; i < max; i++) {	
			sideBarElts[i].style.display=''
		  }
		  editables.aloha()
          bindEvent(document.getElementById('validateChanges'),'click',function(e){
	        Aloha.jQuery('.editable').each(function(i,e){
              var editPart = Aloha.getEditableById(e.id)
              if(editPart && editPart.isModified()){
                socket.emit('updateData',{id:idTab[e.id],value:editPart.getContents(),pageId:currentPage,partId:e.id})     
              }
            })			
		    editables.mahalo();
			var sideBarElts = document.getElementsByClassName('aloha-ui')
			for (var i = 0, max = sideBarElts.length; i < max; i++) {	
				sideBarElts[i].style.display='none'
			}
          })
		})
	})
  }
  
  bindEvent(document.getElementById('enableChanges'),'click',function(e){
    startAloha()
  })
  menuElements = document.getElementsByClassName('menuElement')
  for (var i = 0, max = menuElements.length; i < max; i++) {
	bindEvent(menuElements[i],'click',function(e){
	  socket.emit('requestPage',{pageId:e.target.id}) 
	})	
  }

})(window);