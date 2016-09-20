chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('SpecRunner.html', {
    'outerBounds': {
      'width': 400,
      'height': 500,
      'top': 0,
      'left': 0
    }
  });
});
