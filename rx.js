const BATTERY_LEVEL = 0x05;
const VERSION = 0x06;
const SETTINGS = 0x0A;
const IMG_LIST = 0x47;
const FONT_LIST = 0x50;
const LAYOUT_LIST = 0x64;
const LAYOUT_GET  = 0x67;
const GAUGE_LIST  = 0x73;
const GAUGE_GET  = 0x74;
const PAGE_GET  = 0x81;
const PAGE_LIST  = 0x85;
const ANIM_LIST  = 0x99;
const PIXEL_COUNT = 0xA5;
const CFG_READ  = 0xD1;
const CFG_LIST  = 0xD3;
const CFG_FREE_SPACE  = 0xD7;
const CFG_GE_NB  = 0xD8;
const ERROR  = 0xE2;
const DEVICE_INFO  = 0xE3;


export function decodeRxData(data) {
    const command = data.getUint8(1); // Fixed a missing const declaration
    const payload = new Uint8Array(data.buffer, 4); // Create a new array starting from index 4
    let dataDecode = null;
    switch (command) {
        case BATTERY_LEVEL:
          dataDecode = decodeBatteryLevel(payload);
          break;
        case VERSION:
          dataDecode = decodeVersion(payload);
          break;
        case SETTINGS:
          dataDecode = decodeSettings(payload);
          break;
        case IMG_LIST:
          dataDecode = decodeImageList(payload);
          break;
        case FONT_LIST:
          dataDecode = decodeFontList(payload);
          break;
        case LAYOUT_LIST:
          dataDecode = decodeLayoutList(payload);
          break;
        case LAYOUT_GET:
          dataDecode = decodeLayoutParameters(payload);
          break;
        case GAUGE_LIST:
          dataDecode = decodeGaugeList(payload);
          break;
        case GAUGE_GET:
          dataDecode = decodeGaugeParameters(payload);
          break;
        case PAGE_GET:
          dataDecode = decodePageData(payload);
          break;
        case PAGE_LIST:
          dataDecode = decodePageList(payload);
          break;
        case ANIM_LIST:
          dataDecode = decodeAnimationList(payload);
          break;
        case PIXEL_COUNT:
          dataDecode = decodePixelCount(payload);
          break;
        case CFG_READ:
          dataDecode = decodeConfigurationReadData(payload);
          break;
        case CFG_LIST:
          dataDecode = decodeConfigurationListData(payload);
          break;
        case CFG_FREE_SPACE:
          dataDecode = decodeConfigurationFreeSpace(payload);
          break;
        case CFG_GE_NB:
          dataDecode = decodeConfigurationNumber(payload);
          break;
        case ERROR:
          dataDecode = decodeErrorMessage(payload);
          break;
        case DEVICE_INFO:
          dataDecode = decodeDeviceInfoMessage(payload);
          break;
        default:
            // Handle other cases
    }
    return dataDecode;
}

function decodeBatteryLevel(payload) {
    if (payload.length >= 1) {
        const batteryLevelHex = payload[0];
        const batteryLevelDecimal = parseInt(batteryLevelHex, 16);

        // Create a battery level object
        const batteryLevelObj = {
            batteryLevel: batteryLevelDecimal
        };

        return batteryLevelObj;
    } else {
        console.error("Payload length is too short to decode battery level.");
        return null;
    }
}

function decodeVersion(payload) {
    if (payload.length >= 9) {
        const fwVersion = [
            payload[0], // Major version
            payload[1], // Minor version
            payload[2], // Patch version
            payload[3] // Build version
        ];
        const mfcYear = payload[4]; // Manufacturing year
        const mfcWeek = payload[5]; // Manufacturing week
        const serialNumber = [
            payload[6], // Serial number byte 1
            payload[7], // Serial number byte 2
            payload[8] // Serial number byte 3
        ];

        // Create a version object
        const versionObj = {
            firmwareVersion: fwVersion.join('.'),
            manufacturingYear: mfcYear,
            manufacturingWeek: mfcWeek,
            serialNumber: serialNumber.join('')
        };

        return versionObj;
    } else {
        console.error("Payload length is too short to decode version information.");
        return null;
    }
}

function decodeSettings(payload) {
    if (payload.length >= 5) {
        const xShift = payload[0]; // Global X shift
        const yShift = payload[1]; // Global Y shift
        const luma = payload[2]; // Display luminance (0 to 15)
        const alsEnable = !!payload[3]; // Auto-brightness adjustment status (convert to boolean)
        const gestureEnable = !!payload[4]; // Gesture detection status (convert to boolean)

        // Create a settings object
        const settingsObj = {
            xShift,
            yShift,
            luminance: luma,
            autoBrightnessAdjustment: alsEnable,
            gestureDetection: gestureEnable
        };

        return settingsObj;
    } else {
        console.error("Payload length is too short to decode settings information.");
        return null;
    }
}

function decodeImageList(payload) {
    if (payload.length % 7 === 0) {
        const imageList = [];

        for (let i = 0; i < payload.length; i += 7) {
            const id = payload[i];
            const height = (payload[i + 1] << 8) | payload[i + 2];
            const width = (payload[i + 3] << 8) | payload[i + 4];

            imageList.push({
                id,
                height,
                width,
            });
        }

        return imageList.map((image) => ({
            id: image.id,
            height: image.height,
            width: image.width,
        }));
    } else {
        console.error("Payload length is not valid for decoding image list.");
        return null;
    }
}

function decodeFontList(payload) {
    if (payload.length % 2 === 0) {
        const fontList = [];

        for (let i = 0; i < payload.length; i += 2) {
            const id = payload[i];
            const height = payload[i + 1];

            fontList.push({
                id,
                height,
            });
        }

        return fontList.map((font) => ({
            id: font.id,
            height: font.height,
        }));
    } else {
        console.error("Payload length is not valid for decoding font list.");
        return null;
    }
}

function decodeLayoutList(payload) {
    const layoutList = [];

    for (const element of payload) {
        const layoutId = element;
        layoutList.push({ id: layoutId });
    }

    return layoutList;
}

function decodeLayoutParameters(payload) {
  if (payload.length >= 17) {
      const id = payload[0];
      const size = payload[1];
      const x = (payload[2] << 8) | payload[3];
      const y = payload[4];
      const width = (payload[5] << 8) | payload[6];
      const height = payload[7];
      const foreColor = payload[8];
      const backColor = payload[9];
      const font = payload[10];
      const textValid = !!payload[11];
      const textX = (payload[12] << 8) | payload[13];
      const textY = payload[14];
      const textRotation = payload[15];
      const textOpacity = !!payload[16];

      // Additional command data
      const commands = payload.slice(17);

      // Create a layout parameters object
      const layoutParams = {
          id,
          size,
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
          commands,
      };

      return layoutParams;
  } else {
      console.error("Payload length is too short to decode layout parameters.");
      return null;
  }
}

function decodeGaugeList(payload) {
  if (payload.length > 0) {
      const gaugeList = payload.map((id) => ({ id }));

      return gaugeList;
  } else {
      console.error("Payload length is not valid for decoding gauge list.");
      return null;
  }
}

function decodeGaugeParameters(payload) {
  if (payload.length >= 11) {
      const x = (payload[0] << 8) | payload[1];
      const y = (payload[2] << 8) | payload[3];
      const r = (payload[4] << 8) | payload[5];
      const rIn = (payload[6] << 8) | payload[7];
      const start = payload[8];
      const end = payload[9];
      const clockWise = !!payload[10];

      // Create a gauge parameters object
      const gaugeParams = {
          x,
          y,
          r,
          rIn,
          start,
          end,
          clockWise,
      };

      return gaugeParams;
  } else {
      console.error("Payload length is too short to decode gauge parameters.");
      return null;
  }
}

// Decode Page List
export function decodePageList(payload) {
  if (payload.length > 0) {
      const pageIds = Array.from(payload);
      return {
          pageIds,
      };
  } else {
      console.error("Payload is empty or invalid for decoding page list.");
      return null;
  }
}

// Decode Page Data
export function decodePageData(payload) {
  if (payload.length >= 1) {
      const pageId = payload[0];
      const layouts = [];

      for (let i = 1; i < payload.length; i += 4) {
          const layoutId = payload[i];
          const x = (payload[i + 1] << 8) | payload[i + 2];
          const y = payload[i + 3];

          layouts.push({
              layoutId,
              x,
              y,
          });
      }

      return {
          pageId,
          layouts,
      };
  } else {
      console.error("Payload length is too short to decode page data.");
      return null;
  }
}

function decodeAnimationList(payload) {
  const animationList = [];

  for (let i = 0; i < payload.length; i++) {
    const id = payload[i];
    animationList.push({
      id,
    });
  }

  return animationList;
}

function decodePixelCount(payload) {
  if (payload.length >= 4) {
    const count = (payload[0] << 24) | (payload[1] << 16) | (payload[2] << 8) | payload[3];

    return {
      count,
    };
  } else {
    console.error("Payload length is too short to decode pixel count.");
    return null;
  }
}

function decodeConfigurationReadData(payload) {
  if (payload.length >= 9) {
    const version = (payload[0] << 24) | (payload[1] << 16) | (payload[2] << 8) | payload[3];
    const nbImg = payload[4];
    const nbLayout = payload[5];
    const nbFont = payload[6];
    const nbPage = payload[7];
    const nbGauge = payload[8];

    return {
      version,
      nbImg,
      nbLayout,
      nbFont,
      nbPage,
      nbGauge,
    };
  } else {
    console.error("Payload length is too short to decode configuration read data.");
    return null;
  }
}

function decodeConfigurationListData(payload) {
  const configurations = [];
  for (let i = 0; i < payload.length; i += 26) {
    const name = new TextDecoder().decode(payload.slice(i, i + 12)).trim();
    const size = (payload[i + 12] << 24) | (payload[i + 13] << 16) | (payload[i + 14] << 8) | payload[i + 15];
    const version = (payload[i + 16] << 24) | (payload[i + 17] << 16) | (payload[i + 18] << 8) | payload[i + 19];
    const usgCnt = payload[i + 20];
    const installCnt = payload[i + 21];
    const isSystem = !!payload[i + 22];

    configurations.push({
      name,
      size,
      version,
      usgCnt,
      installCnt,
      isSystem,
    });
  }

  return configurations;
}

function decodeConfigurationFreeSpace(payload) {
  if (payload.length >= 8) {
    const totalSize = (payload[0] << 24) | (payload[1] << 16) | (payload[2] << 8) | payload[3];
    const freeSpace = (payload[4] << 24) | (payload[5] << 16) | (payload[6] << 8) | payload[7];

    return {
      totalSize,
      freeSpace,
    };
  } else {
    console.error("Payload length is too short to decode configuration free space data.");
    return null;
  }
}

function decodeConfigurationNumber(payload) {
  if (payload.length >= 1) {
    const nbConfig = payload[0];

    return {
      nbConfig,
    };
  } else {
    console.error("Payload length is too short to decode configuration number data.");
    return null;
  }
}

function decodeErrorMessage(payload) {
  if (payload.length >= 3) {
    const cmdId = payload[0];
    const errorCode = payload[1];
    const subErrorCode = payload[2];

    // Create an error object
    const errorObj = {
      cmdId,
      errorCode,
      subErrorCode,
    };

    return errorObj;
  } else {
    console.error("Payload length is too short to decode error message.");
    return null;
  }
}

function decodeDeviceInfoMessage(payload) {
  if (payload.length === 0) {
    console.error("Payload is empty.");
    return null;
  }

  const deviceInfoObj = {};

  // Loop through the payload to access and decode each parameter.
  for (let i = 0; i < payload.length; i++) {
    // Access and decode the current parameter
    const parameterValue = payload[i];
    deviceInfoObj[`parameter${i}`] = parameterValue;
  }

  return deviceInfoObj;
}




