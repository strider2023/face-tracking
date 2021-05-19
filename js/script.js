const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    if (detections) {
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const shapeDimensions = {
        forehead: getLength(resizedDetections.landmarks._positions[0], resizedDetections.landmarks._positions[16]),
        cheekbone: getLength(resizedDetections.landmarks._positions[2], resizedDetections.landmarks._positions[14]),
        jawline: getLength(resizedDetections.landmarks._positions[3], resizedDetections.landmarks._positions[13]),
        length: getLength(resizedDetections.landmarks._positions[6], {_x: (resizedDetections.detection._box._x - resizedDetections.detection._box._width), _y: resizedDetections.detection._box._y})
      }
      // console.log(
      //   [resizedDetections.landmarks._positions[0],
      //   resizedDetections.landmarks._positions[16],
      //   getLength(resizedDetections.landmarks._positions[0], resizedDetections.landmarks._positions[16])]);
      // console.log(resizedDetections.landmarks.getJawOutline(), shapeDimensions);
      console.log(detectFaceType(shapeDimensions));
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    }
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    // if (resizedDetections.detection._score > 0.7) {
    //   console.log("face detected");
    // }
    // if (resizedDetections.expressions.neutral > 0.91 && resizedDetections.expressions.neutral < 0.99) {
    //   console.log("neutral");
    // }
  }, 100)
});

// https://www.birchbox.com/guide/article/how-to-determine-face-shape-men
function detectFaceType({forehead, cheekbone, jawline, length}) {
  // (cheekbone == length) && (forehead == jawline) && (forehead < cheekbone) && (forehead < length) && (jawline < cheekbone) && (jawline < length)
  if (checkApproxEquals(cheekbone, length)
    && checkApproxEquals(forehead, jawline)
    && (forehead < cheekbone)
    && (forehead < length)
    && (jawline < cheekbone)
    && (jawline < length)) {
    return 'ROUND';
  }
  // cheekbone == length == forehead == jawline
  else if (checkApproxEquals(cheekbone, length)
    && checkApproxEquals(cheekbone, forehead)
    && checkApproxEquals(cheekbone, jawline)
    && checkApproxEquals(length, forehead)
    && checkApproxEquals(length, jawline)
    && checkApproxEquals(forehead, jawline)) {
    return 'SQUARE';
  }
  // (cheekbone < length) && (forehead < length) && (jawline <  length) && (cheekbone == forehead == jawline)
  else if ((cheekbone < length)
    && (forehead < length)
    && (jawline < length)
    && checkApproxEquals(cheekbone, forehead)
    && checkApproxEquals(cheekbone, jawline)
    && checkApproxEquals(forehead, jawline)) {
    return 'OBLONG';
  }
  // (cheekbone < length) && (forehead < length) && (jawline <  length) && (cheekbone > forehead > jawline)
  else if ((cheekbone < length)
    && (forehead < length)
    && (jawline < length)
    && (cheekbone > forehead > jawline)) {
    return 'DIAMOND';
  }
  // jawline > cheekbone > forehead
  else if (jawline > cheekbone > forehead) {
    return 'TRIANGULAR';
  }
  // (cheekbone < length) && (jawline < forehead)
  else if ((cheekbone < length)
    && (jawline < forehead)) {
    return 'OVAL';
  } else {
    return 'NOT_DETECTED';
  }
}

function checkApproxEquals(v1, v2, epsilon) {
  if (epsilon == null) {
    epsilon = 3.0;//0.001;
  }
  return Math.abs(v1 - v2) < epsilon;
}

function getLength(point1, point2) {
  var dist = Math.sqrt(Math.pow((point1._x - point2._x), 2) + Math.pow((point1._y - point2._y), 2));
  return dist;
}
