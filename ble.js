// ble.js


export async function requestDevice(deviceName, serviceUUID, optionalServices) {
  try {
    const options = {
      filters: [
        { namePrefix: deviceName },
        { services: [serviceUUID] },
      ],
      optionalServices: optionalServices,
    };
    const device = await navigator.bluetooth.requestDevice(options);
    return device;
  } catch (error) {
    console.error('No devices found:', error);
    throw error;
  }
}

export async function connectDevice(device) {
    try {
      const server = await device.gatt.connect();
      return server;
    } catch (error) {
      console.error('Error connecting to Bluetooth device:', error);
      throw error;
    }
  }
  
  export async function subscribeToCharacteristic(service, characteristicStruct, eventHandler) {
    try {
      const characteristic = await service.getCharacteristic(characteristicStruct.uuid);
      await characteristic.startNotifications();
      console.log('Notifications have been started for characteristic:', characteristicStruct.uuid);
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        eventHandler(event, characteristicStruct.type, characteristicStruct.name);
      });
    } catch (error) {
      console.error('Error subscribing to characteristic:', error);
      throw error;
    }
  }
  
  export async function readCharacteristic(service, characteristicStruct) {
    try {
      const characteristic = await service.getCharacteristic(characteristicStruct.uuid);
      const value = await characteristic.readValue();
      let result;

      switch (characteristicStruct.type) {
        case 'string':
          result = new TextDecoder().decode(value);
          break;
        case 'uint8':
          result = value.getUint8(0);
          break;
        case 'uint16':
          result = value.getUint16(0, false); // 'false' for big-endian byte order
          break;
        case 'uint32':
          result = value.getUint32(0, false); // 'false' for big-endian byte order
          break;
        default:
          console.error('Invalid type:', characteristicStruct.type);
          return;
      }
      return result;

    } catch (error) {
      console.error('Error reading characteristic:', error);
      throw error;
    }
  }
  
  export async function writeCommand(characteristic, commandID, commandFormat, queryID, data = []) {
    // Calculate the length based on the command format and data
    const length = commandFormat === 0x10 ? data.length + 6 : data.length + 5;
    const lengthBytes = commandFormat === 0x10 ? [length >> 8, length & 0xFF] : [length & 0xFF];
  
    // Combine the header and data into a single Uint8Array
    const header = new Uint8Array([0xFF, commandID, commandFormat, ...lengthBytes, ...queryID]);
    const footer = new Uint8Array([0xAA]);
    const command = new Uint8Array([...header, ...data, ...footer]);

    // Log the command as a hexadecimal string
    const commandHex = Array.from(command, (byte) => byte.toString(16).padStart(2, '0')).join('');
    console.log('Command sent:', '0x' + commandHex);
    
    // Write the command to the characteristic and wait for a response
    try {
      const response = await characteristic.writeValueWithResponse(command);
      console.log('Command sent successfully');
      // Handle the response if needed
      return response;
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  }
  