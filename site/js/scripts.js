/* 
	Title: 	LocalStorage helper class 
	Author: Max Novakovic
	Desc: 	Gets/sets/deletes/clears localStorage and fallback to cookies if none
*/
var LocalStore = function() {
	this.isStorage = false;
	try {
		typeof(localStorage);
		this.isStorage = true;
	}catch(e){}
};
LocalStore.prototype = {
	set: function(key, value){
		if(this.isStorage){ 
			localStorage.setItem(key, value); 
		} else {
			document.cookie = key+"="+value+"; path=/";
		}
	},
	get: function(key) {
		if(this.isStorage) {
			return localStorage.getItem(key);
		} else {
			var key_equals = key + "=",
			cookies = document.cookie.split(';');
			for(var i=0, j = cookies.length; i < j; i++) {
				var this_cookie = cookies[i];
				while (this_cookie.charAt(0) == ' ') {
					this_cookie = this_cookie.substring(1, this_cookie.length);
				}
				if (this_cookie.indexOf(key_equals) == 0) {
					return this_cookie.substring(key_equals.length, this_cookie.length);
				}
			}
			return null;
			
		}
	},
	del: function(key) {
		if(this.isStorage) {
			localStorage.removeItem(key);
		} else {
			this.set(key,"");
		}
	},
	clear: function() {
		if(this.isStorage) {
			localStorage.clear();
		} else {	
			var cookies = document.cookie.split(';');
			for(var i=0, j = cookies.length; i < j; i++) {
				var this_cookie = cookies[i];
				var equals_position = this_cookie.indexOf("=");
				var name = equals_position > -1 ? this_cookie.substr(0, equals_position) : this_cookie;
				document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
			}

		}
	}
};

/* 
	Title: 	Main website class 
	Author: Max Novakovic
	Desc: 	Provides all the functionality of the website
*/
var HomePage = function(){
	this.ls = new LocalStore;
	this.bg_state_key = "background_toggle";
	this.init();
};
HomePage.prototype = {
	init: function(){
		var $this = this;
		
		// Add event to the colour switcher
		$("#change-colour").click(function(){
			$this.toggleBackground();
		});
		
		// If the background has been set then change it
		if(this.isBackgroundSet()) this.switchBackground();
		
		// Set up scroll events for animated scrolling
		this.setupScrollEvents();
		
		// Configure URLs with data-target="external" to open in a new window
		$('a[data-target="external"]').click(function(e){
			window.open($(this).attr("href"));
			return false;
		});
		
		// Update window.mouse*Pos with the mouse position
		$(document).mousemove(function(e){
      window.mouseXPos = e.pageX;
      window.mouseYPos = e.pageY;
   });
		
		this.initRollovers();
		
		// Add hover event to headings to toggle the paragraph symbol
		$("section>h2, section>h3").hover(function(){
			$(this).children(".pilcrow").show();
		}, function(){
			$(this).children(".pilcrow").hide();
		});
		
		// Start SyntaxHighlighter:
		SyntaxHighlighter.defaults['tab-size'] = 2;
		SyntaxHighlighter.all();
		
		// Load Disqus comments
		this.loadDisqus();
	},
	setupScrollEvents: function(){
		// Animated scrolling for same page links
		$('a[href*=#]').click(function(e) {
			$this_hash = this.hash.slice(1) || "";
	  	e.preventDefault();
			var scrollTo = this.hash ? $(this.hash).offset().top : 0;
			$('html,body').animate({ scrollTop: scrollTo }, '400', function(){
				location.hash = $this_hash;
			});
			return false;
		});

		$(".button").click(function(){
			$(this).children("a").click();
		});

		$("html,body").bind('scroll mousedown DOMMouseScroll mousewheel keyup', function(e){
			if ( e.which > 0 || e.type == "mousedown" || e.type == "mousewheel"){
				$("html,body").stop();
			}
		});
	},
	initRollovers: function(){
		
		// For parents
		$(".button.parent").each(function(k,v){
			var button_vertical_spacing = 30; // How much to increment button vertical position by
			var id = $(this).children("a").attr("href").replace("#",""); // The ID of the button
			var pos = $(this).position(); // The buttons position
			var total = $('div[data-parent="'+id+'"]').length; // Total number of sub-buttons there are
			var widest = 0; // Holds the width of the widest button
			
			// Container for the position of the newly shown buttons
			var final_position = { top: pos.top+button_vertical_spacing, left: pos.left, bottom: 0, right:0 };
			
			// Loop through each sub-button
			$('div[data-parent="'+id+'"]').each(function(k,v){
				
				// Position it below the parent button and offset the height
				$(this).css({"left": pos.left, "top": pos.top+(button_vertical_spacing*(k+1))});
				
				// Update widest if this button is wider
				widest = $(this).width() > widest ? $(this).width() : widest;
				
				// If the end of the loop has been reached
				if(k == (total-1)) {
					// Set the bottom position to the top + how many buttons there were * the button height
					final_position.bottom = final_position.top + (button_vertical_spacing*(k+1))+$(this).height();
					// Set the right position to the left + the widest button width
					final_position.right = final_position.left + widest;
				}
				
			});
			// Add the position data to the element
			$(this).data("boundaries", final_position);
		
		});
		
		// Hover events
		$(".button.parent").mouseenter(function(){
			// First remove any intervals that may still be happenings
			clearInterval($(this).data("interval"));
			
			// Get the ID of the button
			var id = $(this).children("a").attr("href").replace("#","");

			// Loop through each sub-button, stop any animation and then fade it in
			$('div[data-parent="'+id+'"]').each(function(k,v){
				$(this).stop(true, true).fadeIn();
			});
			
		// Mouse leave event
		}).mouseleave(function(e){
			var $this = $(this); // Container for this
			var id = $this.children("a").attr("href").replace("#",""); // The ID of the button
			
			// Set this code to check again ever 650ms
			var interval = setInterval(function(){
				
				// Get the BBox around the sub- buttons
				var position = $this.data("boundaries");
				
				// If over the sub-buttons
				if(window.mouseXPos > position.left && window.mouseXPos < position.right && window.mouseYPos > position.top && window.mouseYPos < position.bottom) {
				
				// Not over the sub-buttons so hide then 
				} else {
					// For each sub-button
					$('div[data-parent="'+id+'"]').each(function(k,v){
						// Stop any animation and fade out
						$(this).stop(true, true).fadeOut();
						// Stop this interval from checking again
						clearInterval(interval);
					});
				}
			},650);
			
			// Assign the interval to this element
			$(this).data("interval",interval);
		});
	},
	isBackgroundSet: function(){
		var bg_key = this.bg_state_key;
		return this.ls.get(bg_key) && this.ls.get(bg_key) == 1;
	},
	toggleBackground: function(){
		var bg_key = this.bg_state_key;
		if(this.ls.get(bg_key)) {
			this.ls.get(bg_key) == "0" ? this.ls.set(bg_key, "1") : this.ls.set(bg_key, "0");
		} else {
			this.ls.set(bg_key, "1");
		}

		this.switchBackground();
	},
	switchBackground: function(){
		var isLight = $("body").hasClass("light");
		
		// Toggle between light and dark
		if(isLight) $("body").removeClass("light").addClass("dark");
		else $("body").removeClass("dark").addClass("light");

		var base_media_url = "http://media.maxnov.com/getimagedata/";
		
		// Toggle the SyntaxHiglighter theme
		var href = isLight ? "min/g=theme-dark" : "min/g=theme";
		href = base_media_url + href;
		$("#theme").attr("href", href);
		
		// Toggle the disturb logo
		var src = isLight ? "img/disturb-dark.png" : "img/disturb-light.png";
		src = base_media_url + src;
		$("#disturb-logo").attr("src", src);

	},
	loadDisqus: function(){
		// Periodically check for load
		var check_disqus = setInterval(function() {
		  if ($("#dsq-comments-title").get(0) != null) {
		    clearInterval(check_disqus); // remove timer
				// Once loaded, add margin to comments header
				$("#comments>h2").css("marginBottom", "-40px");
		  }
		}, 100);
		
		// Load comments
	 	var disqus_developer = true;
	  var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
		dsq.src = 'http://getimagedata.disqus.com/embed.js';
		(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
	}
};

// Init the homepage
$(function(){
	new HomePage;
});