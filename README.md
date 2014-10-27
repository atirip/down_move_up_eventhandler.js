#downMoveUpEventHandler

Helper to handle full - pointer down, pointer move, pointer up - event handling cycle.

- supports mouse, touch and pointer events
- mouse and touch events are handled at the same time (not one or the other as usual)
- on down event move and up event handlers are automatically added (to document)
- on up event move and up handlers are automatically removed
- pointers down are counted, event handlers are only added at first pointer down and removed at last pointer up.
- all native events are simply passed through, except synthesized mobile webkit mouse events, which are ignored
- requirejs & commonjs compatible


### Usage

To add:

		var remove = downMoveUpEventHandler(document.getElementById('target'), function(event) {
			console.log(event.type)
			// mousedown, mousemove, mouseup
			// touchstart, touchmove, touchend, touchcancel
			// pointerdown, pointermove, pointerup, pointercancel
		});

To remove:

		remove();
		
