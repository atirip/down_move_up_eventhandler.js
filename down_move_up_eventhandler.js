/*jshint laxcomma:true, laxbreak: true, asi:true */
;(function() {

	if (typeof define === 'function' && define.amd) {
		define(attachHandler)

	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = attachHandler

	} else {
		window.downMoveUpEventHandler = attachHandler
	}

	var debug = false

	function attachHandler(element, eventHandler, capture, dbg) {
		dbg = debug
		return addDownEventListener(element, function(event) {
			filterSynthMouseEvents(event, function(event) {
				eventHandler(event)
				addMoveAndUpEventListener(event, function(event) {
					filterSynthMouseEvents(event, function(event) {
						eventHandler(event)
						switch (event.type) {
						case 'pointerup':
						case 'pointercancel':
							removeLastAddedPointerListener && removeLastAddedPointerListener(event)
							break

						case 'touchend':
						case 'touchcancel':
							removeLastAddedTouchListener && removeLastAddedTouchListener(event)
							break

						case 'mouseup':
							removeLastAddedMouseListener && removeLastAddedMouseListener(event)
							break
						}
					})
				}, true)
			})
		}, capture)
	}

	var filterSynthMouseEvents = (function() {

		var savedTouches = []

		function isMouseEventSynthesizedFromTouch(event) {
			var threshold = 25
			var touch
			var i = 0
			for (; touch = savedTouches[i]; i++) if ( touch.expect == event.type && Math.abs(event.pageX - touch.x) < threshold && Math.abs(event.pageY - touch.y) < threshold) return true
		}

		function removeTouchEvent (id) {
			var touch
			var i = 0
			for (; touch = savedTouches[i]; i++) if ( id == touch.id ) return savedTouches.splice(i, 1)
		}

		function translateTouchTypeToMouse(event) {
			if ( event.type == 'touchstart' ) {
				return 'mousedown'
			} else if ( event.type == 'touchmove' ) {
				return 'mousemove'
			} else if ( event.type == 'touchend' ) {
				return 'mouseup'
			}
		}

		function saveTouchEvent(event) {
			if ( !event.changedTouches ) return
			var touch = event.changedTouches[0]
			savedTouches.push({
				x: touch.pageX
			,	y: touch.pageY
			,	id: touch.identifier
			,	expect: translateTouchTypeToMouse(event)
			})
			setTimeout(removeTouchEvent, 1000, touch.identifier)
		}

		function handleEvent(event, next) {
			if (!pointer) switch (event.type) {
				case 'mousedown':
					if ( isMouseEventSynthesizedFromTouch(event) ) return
					break

				case 'touchstart':
					saveTouchEvent(event)
					break

				case 'mousemove':
					if ( isMouseEventSynthesizedFromTouch(event) ) return
					break

				case 'touchmove':
					saveTouchEvent(event)
					break

				case 'mouseup':
					if ( isMouseEventSynthesizedFromTouch(event) ) return
					break

				case 'touchend':
					saveTouchEvent(event)
					break
			}
			next && next(event)
		}

		return handleEvent

	})()

	var pointer = !!window.PointerEvent

	function listener(element, func, handler, capture) {
		return function self(event) {
			if ( element && (element.nodeName || 'setInterval' in element) ) {
				element[func + 'EventListener'](event, handler, !!capture)
			}
			return self
		}
	}

	var removeLastAddedTouchListener = false
	var removeLastAddedPointerListener = false
	var removeLastAddedMouseListener = false

	function addDownEventListener(element, handler, capture) {
		if ( pointer ) {
			listener(element, 'add', handler, capture)('pointerdown')
		} else {
			listener(element, 'add', handler, capture)('touchstart')('mousedown')
		}
		return function(dbg) {
			debug = dbg
			if ( pointer ) {
				listener(element, 'remove', handler, capture)('pointerdown')
			} else {
				listener(element, 'remove', handler, capture)('touchstart')('mousedown')
			}
		}
	}

	function addMoveAndUpEventListener(event, handler, capture) {

		function makeRemove(type) {

			return function(event) {
				// inside event handler we have event, on emergency remove we don't
				if ( pointer) {
					if ( !event || event.isPrimary ) {
						debug && console.log('pointer listener removed')
						listener(document, 'remove', handler, capture)('pointermove')('pointerup')
						removeLastAddedPointerListener = false
					}

				} else if (type == 'touchstart') {
					if ( !event || !event.touches.length ) {
						debug && console.log('touch listener removed')
						listener(document, 'remove', handler, capture)('touchmove')('touchend')('touchcancel')
						removeLastAddedTouchListener = false
					}

				} else {
					debug && console.log('mouse listener removed')
					listener(document, 'remove', handler, capture)('mousemove')('mouseup')
					removeLastAddedMouseListener = false
				}
			}
		}

		if ( pointer ) {
			if ( event.isPrimary ) {
				removeLastAddedPointerListener && removeLastAddedPointerListener()
				debug && console.log('pointer listener added')
				listener(document, 'add', handler, capture)('pointermove')('pointerup')
				removeLastAddedPointerListener = makeRemove(event.type)
			}

		} else if (event.type == 'touchstart') {
			if ( event.touches.length == (event.changedTouches && event.changedTouches.length) ) {
				removeLastAddedTouchListener && removeLastAddedTouchListener()
				debug && console.log('touch listener added')
				listener(document, 'add', handler, capture)('touchmove')('touchend')('touchcancel')
				removeLastAddedTouchListener = makeRemove(event.type)
			}

		} else {
			removeLastAddedMouseListener && removeLastAddedMouseListener()
			debug && console.log('mouse listener added')
			listener(document, 'add', handler, capture)('mousemove')('mouseup')
			removeLastAddedMouseListener = makeRemove(event.type)
		}

	}

})();