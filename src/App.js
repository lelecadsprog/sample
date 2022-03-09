import logo from './logo.svg';
import './App.css';
import * as tf from '@tensorflow/tfjs'
import { useState, useEffect, useRef, createRef } from 'react';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import styled from "styled-components";


function App() {
  
  
const TargetBox = styled.div`
  position: absolute;
  left: ${({ x }) => x + "px"};
  top: ${({ y }) => y + "px"};
  width: ${({ width }) => width + "px"};
  height: ${({ height }) => height + "px"};
  border: 4px solid #1ac71a;
  background-color: transparent;
  z-index: 20;
  &::before {
    content: "${({ classType, score }) => `${classType} ${score.toFixed(1)}%`}";
    color: #1ac71a;
    font-weight: 500;
    font-size: 17px;
    position: absolute;
    top: -1.5em;
    left: -5px;
  }
`;



  const [isModelLoading, setIsModelLoading] = useState(false)
  const [model, setModel] = useState(null)
  const [selectedImages, setSelectedImages] = useState(null)
  const [results, setResult] = useState([])

  let imageref = useRef()
  // const imageSize = {
  //   imgWidth: imageref.current.width,
  //   imgHeight: imageref.current.height
  // }

  const url = {
    modelurl: 'https://raw.githubusercontent.com/lelecadsprog/parking-slot/main/src/model/model.json'  
  }
   // Single image
   const uploadImage = (e) => {
    const { files } = e.target
    if (files.length > 0) {
      const fileurl = URL.createObjectURL(files[0])
      setSelectedImages(fileurl)
      const imageElement = files
      imageElement.onload = async () => {
      const imgSize = {
        width: imageElement.width,
        height: imageElement.height,
      };
      await identify(imageElement, imgSize);
      setIsModelLoading(false);
    }
      
    } else {
      setSelectedImages(null)
    }
  }

  const isEmptyPredictions = !results || results.length === 0;

  async function loadModel(url) {
    setIsModelLoading(true)
    try {
      const model = await tf.loadGraphModel(url.modelurl);
      setModel(model);
      setIsModelLoading(false)
    }
    catch (err) {
      console.log(err);
      setIsModelLoading(false)
    }
  }

  const normalizePredictions = (results, imgSize) => {
    if (!results || !imgSize || !imageref) return results || [];
    return results.map((prediction) => {
      const { bbox } = prediction;
      const oldX = bbox[0];
      const oldY = bbox[1];
      const oldWidth = bbox[2];
      const oldHeight = bbox[3];

      const imgWidth = imageref.current.width;
      const imgHeight = imageref.current.height;

      const x = (oldX * imgWidth) / imgSize.width;
      const y = (oldY * imgHeight) / imgSize.height;
      const width = (oldWidth * imgWidth) / imgSize.width;
      const height = (oldHeight * imgHeight) / imgSize.height;

      return { ...prediction, bbox: [x, y, width, height] };
    });
  };

  // const detectObjectsOnImage = async (imageElement, imgSize) => {
  //   const model = await cocoSsd.load({});
  //   const predictions = await model.detect(imageElement, 6);
  //   const normalizedPredictions = normalizePredictions(predictions, imgSize);
  //   setPredictions(normalizedPredictions);
  //   console.log("Predictions: ", predictions);


  // };

  const identify = async (imageElement, imgSize) => {
    let tensor = tf.browser.fromPixels(imageref.current, 3).resizeNearestNeighbor([416, 416]).toFloat().expandDims();
    let prediction = await model.predict(tensor).data()
    const normalizedPredictions = normalizePredictions(prediction, imgSize)
    setResult(normalizedPredictions)
    console.log(results);
    console.log(tensor);
    console.log(prediction);
    setResult(prediction)

    

/*
    let result = Array.from(prediction).map((prob, index) => {
      return {
        probability: prob,
        className: TARGET_CLASSES[index]
      };
    }).sort((x, y) => {
      return y.probability - x.probability
    }).slice(0, 1) */
    
  }



  useEffect(() => {
    tf.ready().then(() => {
      loadModel(url)
    });
  }, [])

  if (isModelLoading) {
    return <h2>Model loading....</h2>
  }

  
  return (
    <div className="App">
      
    <main role="main" className="container mt-5">
			
			<div className="row">
				<div className="col-6">
					<input id="image-selector" className="form-control border-0" type="file" onChange={uploadImage}/>
				</div>
				<div className="col-6">
					<button id="predict-button" className="btn btn-primary float-right" onClick={identify}>Predict</button>
				</div>
			</div>
			<hr/>
			<div className="row">
				<div className="col-12">
					<h2 className="ml-3">Image</h2>
					<div id="imageOverlay" className="imageOverlay">
            
						{selectedImages && <img id="selectedImage" className="ml-3" width={"500px"} height={"500px"} alt="" src={selectedImages} key={selectedImages} ref={imageref} crossOrigin='anonymous'/> }
            {!isEmptyPredictions &&
          results.map((prediction, idx) => {
            return(<TargetBox
              key={idx}
              x={prediction.bbox[0]}
              y={prediction.bbox[1]}
              width={prediction.bbox[2]}
              height={prediction.bbox[3]}
              classType={prediction.class}
              score={prediction.score * 100}
            />)
          }
            
          )}
          </div>
				</div>
			</div>
		</main>
    </div>

    
  );
}

export default App;
