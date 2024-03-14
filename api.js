import * as ble from './ble.js';
import * as rx from './rx.js';

const BLUETOOTH_SERVICES = {
  DIS_SERVICE: {
    uuid: 0x180A,
    characteristics: {
      MANUFACTURER_NAME: {
        uuid: '00002a29-0000-1000-8000-00805f9b34fb',
        properties: ['read'],
        type: 'string',
        name: 'MANUFACTURER_NAME',
        value: null,
      },
      MODEL_NUMBER: {
        uuid: '00002a24-0000-1000-8000-00805f9b34fb',
        properties: ['read'],
        type: 'string',
        name: 'MODEL_NUMBER',
        value: null,
      },
      // SERIAL_NUMBER_STRING: {
      //   uuid: '00002a25-0000-1000-8000-00805f9b34db',
      //   properties: ['read'],
      //   value: null,
      // },
      HARDWARE_VERSION: {
        uuid: '00002a27-0000-1000-8000-00805f9b34fb',
        properties: ['read'],
        type: 'string',
        name: 'HARDWARE_VERSION',
        value: null,
      },
      FIRMWARE_VERSION: {
        uuid: '00002a26-0000-1000-8000-00805f9b34db',
        properties: ['read'],
        type: 'string',
        name: 'FIRMWARE_VERSION',
        value: null,
      },
      SOFTWARE_VERSION: {
        uuid: '00002a28-0000-1000-8000-00805f9b34fb',
        properties: ['read'],
        type: 'string',
        name: 'SOFTWARE_VERSION',
        value: null,
      },
    },
  },
  DEVICE_CUSTOM_SERVICE: {
    uuid: '0783b03e-8535-b5a0-7140-a304d2495cb7',
    characteristics: {
      TX_ACTIVELOOK: {
        uuid: '0783b03e-8535-b5a0-7140-a304d2495cb8',
        properties: ['notify'],
        type: 'uint8',
        name: 'DEVICE_CUSTOM_SERVICE',
        descriptors: ['UUID 0x2902 configuration'],
        value: null,
      },
      RX_ACTIVELOOK: {
        uuid: '0783b03e-8535-b5a0-7140-a304d2495cba',
        properties: ['write', 'writeWithoutResponse'],
        type: 'uint8',
        name: 'RX_ACTIVELOOK',
        descriptors: ['UUID 0x2902 configuration'],
        value: null,
      },
      CONTROL: {
        uuid: '0783b03e-8535-b5a0-7140-a304d2495cb9',
        properties: ['notify'],
        type: 'uint8',
        name: 'CONTROL',
        descriptors: ['UUID 0x2902 configuration'],
        value: null,
      },
      GESTURE_EVENT: {
        uuid: '0783b03e-8535-b5a0-7140-a304d2495cbb',
        properties: ['notify'],
        type: 'uint8',
        name: 'GESTURE_EVENT',
        descriptors: ['UUID 0x2902 configuration'],
        value: null,
      },
      TOUCH_EVENT: {
        uuid: '0783b03e-8535-b5a0-7140-a304d2495cbc',
        properties: ['notify'],
        type: 'uint8',
        name: 'TOUCH_EVENT',
        descriptors: ['UUID 0x2902 configuration'],
        value: null,
      },
    },
  },
  BATTERY_SERVICE: {
    uuid: 0x180F, 
    characteristics: {
      BATTERY_LEVEL: {
        uuid: '00002a19-0000-1000-8000-00805f9b34fb',
        properties: ['read', 'notify'],
        type: 'uint8',
        name: 'BATTERY_LEVEL',
        descriptors: ['UUID 0x2902 configuration'],
        value: 'battery level (in %)',
      },
    },
  },
};
const NAME = 'ENGO';

let device = null;
let server = null;

let batteryService = null;
let DISService = null;
let customService = null;
let RxCharacteristic = null;

export function decodeControlReceiveData(data){
  try {
    return rx.decodeRxData(data);
  } catch (error) {
    console.error('Error decoding:', error);
    throw error;
  }
}

export async function connectToDevice() {
    try {
      const optionalServices = [
          Number(BLUETOOTH_SERVICES.BATTERY_SERVICE.uuid),
          BLUETOOTH_SERVICES.DEVICE_CUSTOM_SERVICE.uuid,
          Number(BLUETOOTH_SERVICES.DIS_SERVICE.uuid)
          ];
      const serviceUUID = BLUETOOTH_SERVICES.DEVICE_CUSTOM_SERVICE.uuid;
      device = await ble.requestDevice(NAME, serviceUUID, optionalServices);
      server = await ble.connectDevice(device);

      batteryService = await server.getPrimaryService(BLUETOOTH_SERVICES.BATTERY_SERVICE.uuid);
      DISService = await server.getPrimaryService(BLUETOOTH_SERVICES.DIS_SERVICE.uuid);
      customService = await server.getPrimaryService(BLUETOOTH_SERVICES.DEVICE_CUSTOM_SERVICE.uuid);

      RxCharacteristic = await customService.getCharacteristic(BLUETOOTH_SERVICES.DEVICE_CUSTOM_SERVICE.characteristics.RX_ACTIVELOOK.uuid);
      console.log('Connected successfully!');
      return device;
    } catch (error) {
      console.error('Error connecting:', error);
      throw error;
    }
  }

export async function subscribeToBAS(eventHandler) {
  try {
    await ble.subscribeToCharacteristic(batteryService, BLUETOOTH_SERVICES.BATTERY_SERVICE.characteristics.BATTERY_LEVEL, eventHandler);
  } catch (error) {
    console.error('Error sub to BAS:', error);
    throw error;
  }
}

export async function readBAS() {
  try {
    const value = await ble.readCharacteristic(batteryService, BLUETOOTH_SERVICES.BATTERY_SERVICE.characteristics.BATTERY_LEVEL);
    return value;
  } catch (error) {
    console.error('Error read BAS:', error);
    throw error;
  }
}

export async function readDIS(characteristicName) {
  try {
    const serviceName = 'DIS_SERVICE';
    const property = 'read';
    const characteristicStruct = getCharacteristicStruct(serviceName, characteristicName, property);
    if (characteristicStruct) {
      const value = await ble.readCharacteristic(DISService, characteristicStruct);
      return value;
    }
    else {
      console.log('No characteristic found');
      return;
    }
  } catch (error) {
    console.error('Error sub to DIS:', error, characteristicName);
    throw error;
  }
}

export async function subscribeToCustom(eventHandler, characteristicName) {
  try {
    const serviceName = 'DEVICE_CUSTOM_SERVICE';
    const property = 'notify';
    const characteristicStruct = getCharacteristicStruct(serviceName, characteristicName, property);
    if (characteristicStruct) {
      await ble.subscribeToCharacteristic(customService, characteristicStruct, eventHandler);
    }
    else {
      console.log('No characteristic found');
      return;
    }
  } catch (error) {
    console.error('Error sub to CUSTOM:', error, characteristicName);
    throw error;
  }
}

// GENERAL COMMANDS //
// Command ID: 0x00 - Enable / Disable Display Power
export async function enableDisplayPower(enable) {
  const commandID = 0x00;
  const data = [enable ? 1 : 0];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x01 - Clear Display
export async function clearDisplay() {
  const commandID = 0x01;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, []);
}

// Command ID: 0x02 - Set Grey Level
export async function setGreyLevel(level) {
  const commandID = 0x02;
  const data = new Uint8Array([level]); // Assuming 'level' is a valid grey level (0 to 15)
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x03 - Display Demo
export async function displayDemo(demoID) {
  const commandID = 0x03;
  const data = new Uint8Array([demoID]); // 0: Fill screen, 1: Rectangle with a cross, 2: Display saved images, etc.
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x05 - Get Battery Level
export async function getBatteryLevel() {
  const commandID = 0x05;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, []);
}

// Command ID: 0x06 - Get Device ID and Firmware Version
export async function getDeviceVersion() {
  const commandID = 0x06;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, []);
}

// Command ID: 0x08 - Set LED
export async function setLED(state) {
  const commandID = 0x08;
  const data = new Uint8Array([state]); // 0: Off, 1: On, 2: Toggle, 3: Blinking
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x09 - Shift Display
export async function shiftDisplay(x, y) {
  const commandID = 0x09;
  const data = new Uint8Array([
    (x >> 8) & 0xFF,  // High byte of x
    x & 0xFF,         // Low byte of x
    (y >> 8) & 0xFF,  // High byte of y
    y & 0xFF          // Low byte of y
  ]);

  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x0A - Get User Parameters
export async function getUserParameters() {
  const commandID = 0x0A;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, []);
}

//  Display luminance commands //
// Command ID: 0x10 - Set Display Luminance
export async function setDisplayLuminance(level) {
  const commandID = 0x10;
  const data = new Uint8Array([level]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Optical sensor commands //
// Command ID: 0x20 - Turn On/Off Sensor
export async function toggleSensor(enable) {
  const commandID = 0x20;
  const data = [enable ? 1 : 0];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x21 - Turn On/Off Gesture Detection
export async function toggleGestureDetection(enable) {
  const commandID = 0x21;
  const data = [enable ? 1 : 0];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x22 - Turn On/Off Auto-Brightness Adjustment
export async function toggleAutoBrightness(enable) {
  const commandID = 0x22;
  const data = [enable ? 1 : 0];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Graphics commands //
// Command ID: 0x30 - Set Graphics Color
export async function setGraphicsColor(color) {
  const commandID = 0x30;
  const data = new Uint8Array([color]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x31 - Draw a Pixel
export async function drawPixel(x, y) {
  const commandID = 0x31;
  const data = new Uint8Array([x >> 8, x & 0xFF, y >> 8, y & 0xFF]); // Combine x and y as 16-bit signed values
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x32 - Draw a Line
export async function drawLine(x0, y0, x1, y1) {
  const commandID = 0x32;
  const data = new Uint8Array([
    (x0 >> 8) & 0xFF, x0 & 0xFF,
    (y0 >> 8) & 0xFF, y0 & 0xFF,
    (x1 >> 8) & 0xFF, x1 & 0xFF,
    (y1 >> 8) & 0xFF, y1 & 0xFF
  ]); // Combine coordinates as 16-bit signed values
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x33 - Draw an empty rectangle
export async function drawEmptyRectangle(x0, y0, x1, y1) {
  const commandID = 0x33;
  const data = new Uint8Array([
    (x0 >> 8) & 0xFF, x0 & 0xFF,
    (y0 >> 8) & 0xFF, y0 & 0xFF,
    (x1 >> 8) & 0xFF, x1 & 0xFF,
    (y1 >> 8) & 0xFF, y1 & 0xFF
  ]); // Combine coordinates as 16-bit signed values
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x34 - Draw a full rectangle
export async function drawFullRectangle(x0, y0, x1, y1) {
  const commandID = 0x34;
  const data = new Uint8Array([
    (x0 >> 8) & 0xFF, x0 & 0xFF,
    (y0 >> 8) & 0xFF, y0 & 0xFF,
    (x1 >> 8) & 0xFF, x1 & 0xFF,
    (y1 >> 8) & 0xFF, y1 & 0xFF
  ]); // Combine coordinates as 16-bit signed values
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x35 - Draw an empty circle
export async function drawEmptyCircle(x, y, r) {
  const commandID = 0x35;
  const data = new Uint8Array([
    (x >> 8) & 0xFF, x & 0xFF,
    (y >> 8) & 0xFF, y & 0xFF,
    r & 0xFF
  ]); // Combine coordinates as 16-bit signed values and radius as an 8-bit value
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x36 - Draw a full circle
export async function drawFullCircle(x, y, r) {
  const commandID = 0x36;
  const data = new Uint8Array([
    (x >> 8) & 0xFF, x & 0xFF,
    (y >> 8) & 0xFF, y & 0xFF,
    r & 0xFF
  ]); // Combine coordinates as 16-bit signed values and radius as an 8-bit value
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x37 - Write text string
export async function writeTextString(x, y, rotation, fontSize, color, text) {
  const commandID = 0x37;
  const textLength = text.length;
  const data = [
    (x >> 8) & 0xFF, x & 0xFF,
    (y >> 8) & 0xFF, y & 0xFF,
    rotation,
    fontSize,
    color,
  ];

  // Append the text as bytes
  for (let i = 0; i < textLength; i++) {
    data.push(text.charCodeAt(i) & 0xFF);
  }

  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], new Uint8Array(data));
}

// Command ID: 0x38 - Draw multiple connected lines
export async function drawPolyline(thickness, coordinates) {
  const commandID = 0x38;
  const numCoordinates = coordinates.length / 2;
  const data = new Uint8Array([
    thickness,
    0, 0, // Reserved bytes
  ]);

  // Append the coordinates
  for (let i = 0; i < numCoordinates; i++) {
    const x = coordinates[i * 2];
    const y = coordinates[i * 2 + 1];
    data.push((x >> 8) & 0xFF, x & 0xFF, (y >> 8) & 0xFF, y & 0xFF);
  }

  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x39 - Hold or flush the graphic engine
export async function holdOrFlushGraphicEngine(action) {
  const commandID = 0x39;
  const data = new Uint8Array([action]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}


// Images cmd //
// Command ID: 0x41 - Save an image
export async function saveImage(id, size, width, format) {
  const commandID = 0x41;
  const data = new Uint8Array([
    id,                 // Image ID
    size >> 24,         // Size (MSB)
    (size >> 16) & 0xFF,// Size (2nd byte)
    (size >> 8) & 0xFF, // Size (3rd byte)
    size & 0xFF,        // Size (LSB)
    width >> 8,         // Image width (MSB)
    width & 0xFF,       // Image width (LSB)
    format              // Image format (0x00, 0x01, 0x02, 0x03, or 0x08)
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x42 - Display Image
export async function displayImage(id, x, y) {
  const commandID = 0x42;
  const data = new Uint8Array([id, x >> 8, x & 0xFF, y >> 8, y & 0xFF]); // Combine coordinates as 16-bit signed values
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x44 - Stream Image
export async function streamImage(size, width, x, y, format) {
  const commandID = 0x44;
  const data = new Uint8Array([
    size >> 24, (size >> 16) & 0xFF, (size >> 8) & 0xFF, size & 0xFF,
    width >> 8, width & 0xFF,
    x >> 8, x & 0xFF,
    y >> 8, y & 0xFF,
    format
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x46 - Delete Image
export async function deleteImage(id) {
  const commandID = 0x46;
  const data = new Uint8Array([id]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x47 - List Images
export async function getImageList() {
  const commandID = 0x47;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], []);
}


// Fonts commands //
// Command ID: 0x50 - Font List
export async function listFonts() {
  const commandID = 0x50;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], []);
}

// Command ID: 0x51 - Font Save (1st chunk)
export async function saveFont(id, size, data) {
  const commandID = 0x51;
  const firstChunk = [id, size >> 8, size & 0xFF];
  const dataToSend = new Uint8Array([...firstChunk, ...data]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], dataToSend);
}

// Command ID: 0x52 - Font Select
export async function selectFont(id) {
  const commandID = 0x52;
  const dataToSend = [id];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], dataToSend);
}

// Command ID: 0x53 - Font Delete
export async function deleteFont(id) {
  const commandID = 0x53;
  const dataToSend = [id];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], dataToSend);
}

// Layout commands //
export async function saveLayoutParameters(
  layoutId,
  x,
  y,
  width,
  height,
  foreColor,
  backColor,
  font,
  textValid,
  textX,
  textY,
  textRotation,
  textOpacity,
  additionalCommands = []
) {
  const maxAdditionalCommandsSize = 126 - 17; // Max size for additional commands based on the layout data format

  if (additionalCommands.length * 4 > maxAdditionalCommandsSize) {
    console.error('Additional commands exceed the maximum size.');
    return null;
  }

  const layoutData = new Uint8Array(126); // Create a Uint8Array for layout data
  
  // Set values based on the byte offsets and parameter definitions
  layoutData[0] = layoutId;
  layoutData[2] = x >> 8; // Upper left clipping region X-coordinate (high byte)
  layoutData[3] = x & 0xFF; // Upper left clipping region X-coordinate (low byte)
  layoutData[4] = y; // Upper left clipping region Y-coordinate
  layoutData[5] = width >> 8; // Width of the clipping region (high byte)
  layoutData[6] = width & 0xFF; // Width of the clipping region (low byte)
  layoutData[7] = height; // Height of the clipping region
  layoutData[8] = foreColor; // Fore color
  layoutData[9] = backColor; // Back color
  layoutData[10] = font; // Font
  layoutData[11] = textValid ? 1 : 0; // TextValid (boolean as 0 or 1)
  layoutData[12] = textX >> 8; // Text X-coordinate in the clipping region (high byte)
  layoutData[13] = textX & 0xFF; // Text X-coordinate in the clipping region (low byte)
  layoutData[14] = textY; // Text Y-coordinate in the clipping region
  layoutData[15] = textRotation; // Text rotation
  layoutData[16] = textOpacity ? 1 : 0; // Text opacity (boolean as 0 or 1)

  // Set the size of additional commands
  layoutData[1] = additionalCommands.length * 4;

  // Set additional graphical commands (if any) starting at offset 17
  // Populate this part based on your specific graphical commands
  for (let i = 0; i < additionalCommands.length; i++) {
    layoutData[17 + i] = additionalCommands[i];
  }

  // Save the layout data to the device using the appropriate function
  const commandID = 0x60;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], layoutData);
}

// Command ID: 0x61 - Delete Layout
export async function deleteLayout(id) {
  const commandID = 0x61;
  const data = [id];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x62 - Display Layout
export async function displayLayout(id, text) {
  const commandID = 0x62;
  const textBytes = new TextEncoder().encode(text); // Convert text to bytes
  const data = new Uint8Array([id, ...textBytes]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x63 - Clear Layout
export async function clearLayout(id) {
  const commandID = 0x63;
  const data = [id];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x64 - Layout List
export async function listLayouts() {
  const commandID = 0x64;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], []);
}

// Command ID: 0x65 - Redefine Layout Position
export async function redefineLayoutPosition(id, x, y) {
  const commandID = 0x65;
  const data = new Uint8Array([id, x >> 8, x & 0xFF, y]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x66 - Display Extended Layout
export async function displayExtendedLayout(id, x, y, text, extraCmd) {
  const commandID = 0x66;
  const textBytes = new TextEncoder().encode(text); // Convert text to bytes
  const extraCmdBytes = new Uint8Array(extraCmd); // Convert extraCmd to bytes
  const data = new Uint8Array([
    id,
    x >> 8,
    x & 0xFF,
    y,
    ...textBytes,
    ...extraCmdBytes,
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x67 - Get Layout Parameters
export async function getLayoutParameters(id) {
  const commandID = 0x67;
  const data = new Uint8Array([id]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x68 - Clear Extended Layout
export async function clearExtendedLayout(id, x, y) {
  const commandID = 0x68;
  const dataToSend = [id, x >> 8, x & 0xFF, y];
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], dataToSend);
}

// Command ID: 0x69 - Clear and Display Layout
export async function clearAndDisplayLayout(id, text) {
  const commandID = 0x69;
  const textBytes = new TextEncoder().encode(text); // Convert text to bytes
  const data = new Uint8Array([id, ...textBytes]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x6A - Clear and Display Extended Layout
export async function clearAndDisplayExtendedLayout(id, x, y, text, extraCmd) {
  const commandID = 0x6A;
  const textBytes = new TextEncoder().encode(text); // Convert text to bytes
  const extraCmdBytes = new Uint8Array(extraCmd); // Convert extraCmd to bytes
  const data = new Uint8Array([
    id,
    x >> 8,
    x & 0xFF,
    y,
    ...textBytes,
    ...extraCmdBytes,
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Gauge commands //
// Command ID: 0x70 - Display Gauge
export async function displayGauge(id, value) {
  const commandID = 0x70;
  const data = new Uint8Array([id, value]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x71 - Save Gauge Parameters
export async function saveGaugeParameters(id, x, y, r, rIn, start, end, clockWise) {
  const commandID = 0x71;
  const data = new Uint8Array([
    id, 
    (x >> 8) & 0xFF, x & 0xFF, // Convert x to hexadecimal
    (y >> 8) & 0xFF, y & 0xFF, // Convert y to hexadecimal
    (r >> 8) & 0xFF, r & 0xFF, // Convert r to hexadecimal
    (rIn >> 8) & 0xFF, rIn & 0xFF, // Convert rIn to hexadecimal
    start & 0xFF, // Convert start to hexadecimal (1 byte)
    end & 0xFF,   // Convert end to hexadecimal (1 byte)
    clockWise ? 0x01 : 0x00 // Convert clockWise to hexadecimal
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x00, [], data);
}

// Command ID: 0x72 - Delete Gauge
export async function deleteGauge(id) {
  const commandID = 0x72;
  const data = new Uint8Array([id]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Command ID: 0x73 - List Saved Gauges
export async function listSavedGauges() {
  const commandID = 0x73;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], new Uint8Array());
}

// Command ID: 0x74 - Get Gauge Parameters
export async function getGaugeParameters(id) {
  const commandID = 0x74;
  const data = new Uint8Array([id]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}


// Pages Commands //
// Page Save (0x80)
export function pageSave(id, layoutDataArray) {
  const commandID = 0x80;
  const n = layoutDataArray.length;
  const data = new Uint8Array(1 + n * 4);

  data[0] = id;
  for (let i = 0; i < n; i++) {
      const layoutData = layoutDataArray[i];
      const offset = 1 + i * 4;
      data[offset] = layoutData.layoutId;
      data[offset + 1] = layoutData.x >> 8;
      data[offset + 2] = layoutData.x & 0xFF;
      data[offset + 3] = layoutData.y;
  }

  return ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Page Get (0x81)
export function pageGet(id) {
  const commandID = 0x81;
  const data = new Uint8Array([id]);

  return ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Page Delete (0x82)
export function pageDelete(id) {
  const commandID = 0x82;
  const data = new Uint8Array([id]);

  return ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Page Display (0x83)
export function pageDisplay(id, strings) {
  const commandID = 0x83;
  let data = new Uint8Array();

  // Concatenate the strings with null terminators
  for (const string of strings) {
      const stringBytes = new TextEncoder().encode(string);
      data = Uint8Array.from([...data, ...stringBytes, 0x00]);
  }

  return ble.writeCommand(RxCharacteristic, commandID, 0x10, [id], data);
}

// Page Clear (0x84)
export function pageClear(id) {
  const commandID = 0x84;
  return ble.writeCommand(RxCharacteristic, commandID, 0x10, [id]);
}

// Page List (0x85)
export function getPagelist() {
  const commandID = 0x85;
  return ble.writeCommand(RxCharacteristic, commandID, 0x10, [], new Uint8Array());
}

// Page Clear and Display (0x86)
export async function pageClearAndDisplay(id, strings) {
  const commandID = 0x86;
  const nullTerminatedStrings = strings.join('\0'); // Join strings with null terminators
  const textEncoder = new TextEncoder();
  const stringBytes = textEncoder.encode(nullTerminatedStrings);
  const data = new Uint8Array([id, ...stringBytes]);

  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Animation Commands //
// Save Animation (0x95)
export async function saveAnimation(id, totalSize, imgSize, width, fmt, imgCompressedSize) {
  const commandID = 0x95;
  const data = new Uint8Array([
    id,
    totalSize & 0xFF,
    (totalSize >> 8) & 0xFF,
    (totalSize >> 16) & 0xFF,
    (totalSize >> 24) & 0xFF,
    imgSize & 0xFF,
    (imgSize >> 8) & 0xFF,
    (imgSize >> 16) & 0xFF,
    (imgSize >> 24) & 0xFF,
    width & 0xFF,
    (width >> 8) & 0xFF,
    fmt,
    imgCompressedSize & 0xFF,
    (imgCompressedSize >> 8) & 0xFF,
    (imgCompressedSize >> 16) & 0xFF,
    (imgCompressedSize >> 24) & 0xFF,
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Delete Animation (0x96)
export async function deleteAnimation(id) {
  const commandID = 0x96;
  const data = new Uint8Array([id]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Display Animation (0x97)
export async function displayAnimation(handlerId, id, delay, repeat, x, y) {
  const commandID = 0x97;
  const data = new Uint8Array([
    handlerId,
    id,
    delay & 0xFF,
    (delay >> 8) & 0xFF,
    repeat,
    x & 0xFF,
    (x >> 8) & 0xFF,
    y & 0xFF,
    (y >> 8) & 0xFF,
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Clear Animation (0x98)
export async function clearAnimation(handlerId) {
  const commandID = 0x98;
  const data = new Uint8Array([handlerId]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// List Animation (0x99)
export async function getAnimationList() {
  const commandID = 0x99;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], []);
}

// Statistics commands // 
// pixelCount (0xA5)
export async function pixelCount() {
  const commandID = 0xA5;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], []);
}

// Configurations commands //
// cfgWrite (0xD0) - Write Configuration:
export async function writeConfiguration(name, version, password) {
  const commandID = 0xD0;
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array([
    ...nameBytes.slice(0, 12),
    version & 0xFF,
    (version >> 8) & 0xFF,
    (version >> 16) & 0xFF,
    (version >> 24) & 0xFF,
    password & 0xFF,
    (password >> 8) & 0xFF,
    (password >> 16) & 0xFF,
    (password >> 24) & 0xFF,
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// cfgRead (0xD1) - Read Configuration:
export async function readConfiguration(name) {
  const commandID = 0xD1;
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array([...nameBytes.slice(0, 12)]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// cfgSet (0xD2) - Set Current Configuration:
export async function setCurrentConfiguration(name) {
  const commandID = 0xD2;
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array([...nameBytes.slice(0, 12)]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// cfgList (0xD3) - List Configurations:
export async function listConfigurations() {
  const commandID = 0xD3;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], new Uint8Array());
}

// cfgRename (0xD4) - Rename Configuration:
export async function renameConfiguration(oldName, newName, password) {
  const commandID = 0xD4;
  const oldNameBytes = new TextEncoder().encode(oldName);
  const newNameBytes = new TextEncoder().encode(newName);
  const data = new Uint8Array([
    ...oldNameBytes.slice(0, 12),
    ...newNameBytes.slice(0, 12),
    password & 0xFF,
    (password >> 8) & 0xFF,
    (password >> 16) & 0xFF,
    (password >> 24) & 0xFF,
  ]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// cfgDelete (0xD5) - Delete Configuration:
export async function deleteConfiguration(name) {
  const commandID = 0xD5;
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array([...nameBytes.slice(0, 12)]);
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// cfgDeleteLessUsed (0xD6) - Delete Less Used Configuration:
export async function deleteLessUsedConfiguration() {
  const commandID = 0xD6;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], new Uint8Array());
}

// cfgFreeSpace (0xD7) - Get Free Space:
export async function getFreeSpace() {
  const commandID = 0xD7;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], new Uint8Array());
}

// cfgGetNb (0xD8) - Get Number of Configurations:
export async function getNumberOfConfigurations() {
  const commandID = 0xD8;
  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], new Uint8Array());
}

// Devices Commands //
// Shutdown (0xE0):
export async function shutdownDevice(key) {
  const commandID = 0xE0;
  const data = new Uint8Array(key);

  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Reset (0xE1):
export async function resetDevice(key) {
  const commandID = 0xE1;
  const data = new Uint8Array(key);

  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}

// Read Device Information (0xE3):
// Reads various device information parameters based on the provided ID.
// Parameters:
// - id: The ID of the device information parameter to read.
//   Values:
//   0: Hardware platform
//   1: Manufacturer
//   2: Advertising manufacturer ID
//   3: Model
//   4: Sub-model
//   5: Firmware version
//   6: Serial number
//   7: Battery model
//   8: Lens model
//   9: Display model
//   10: Display orientation
//   11: Certification 1
//   12: Certification 2
//   13: Certification 3
//   14: Certification 4
//   15: Certification 5
//   16: Certification 6
export async function readDeviceInfo(id) {
  const commandID = 0xE3;
  const data = new Uint8Array([id]);

  return await ble.writeCommand(RxCharacteristic, commandID, 0x10, [], data);
}



// LOCAL FUNCTIONS
function getCharacteristicStruct(serviceName, characteristicName, property) {
  // Check if the service exists in BLUETOOTH_SERVICES
  if (BLUETOOTH_SERVICES[serviceName]) {
    const characteristics = BLUETOOTH_SERVICES[serviceName].characteristics;
    // Check if the characteristicName exists in the service's characteristics
    if (characteristics[characteristicName]) {
      const characteristic = characteristics[characteristicName];
      // Check if the property array contains property i.e 'notify'
      if (characteristic?.properties.includes(property)) {
        return characteristic;
      }
    }
  }
  return null; // Return null if not found
}
