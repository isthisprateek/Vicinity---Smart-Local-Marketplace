import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Loads the face-api.js pre-trained models.
 * We need: SSD Mobilenet V1 (face detection), FaceLandmark68Net, and FaceRecognitionNet.
 * These models must be placed in /public/models
 */
export const loadFaceModels = async (): Promise<void> => {
  if (modelsLoaded) return;
  try {
    const MODEL_URL = '/models';
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
    console.log('Face models loaded successfully');
  } catch (error) {
    console.error('Error loading face models:', error);
    throw new Error('Failed to load face recognition models');
  }
};

/**
 * Given an HTMLVideoElement containing the webcam feed, it runs the face 
 * detection and extracts the 128D descriptor for the largest face found.
 */
export const getFaceDescriptor = async (videoEl: HTMLVideoElement): Promise<Float32Array | null> => {
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  try {
    const detection = await faceapi.detectSingleFace(videoEl)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection ? detection.descriptor : null;
  } catch (error) {
    console.error('Face detection failed:', error);
    return null;
  }
};

/**
 * Converts the Float32Array into a standard JavaScript array of numbers
 * so it can be serialized to JSON and sent to the backend.
 */
export const descriptorToArray = (descriptor: Float32Array): number[] => {
  return Array.from(descriptor);
};