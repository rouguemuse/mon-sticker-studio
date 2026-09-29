/**
 * compositionPresets.js
 * Automatically positions Human and Character layers into standard duo presets.
 * Both layers remain completely independent and editable!
 */

export function applyDuoPreset(presetName, humanLayer, characterLayer) {
  if (!humanLayer || !characterLayer) return;

  // Reset rotations
  humanLayer.rotation = 0;
  characterLayer.rotation = 0;

  switch (presetName) {
    case 'shoulder':
      // Character on Shoulder
      humanLayer.x = 240;
      humanLayer.y = 310;
      humanLayer.scale = 0.85;

      characterLayer.x = 350;
      characterLayer.y = 190;
      characterLayer.scale = 0.48;
      characterLayer.rotation = -8;
      break;

    case 'in_arms':
      // Character in Arms / Lap
      humanLayer.x = 256;
      humanLayer.y = 290;
      humanLayer.scale = 0.85;

      characterLayer.x = 256;
      characterLayer.y = 330;
      characterLayer.scale = 0.52;
      break;

    case 'head':
      // Character balanced on top of head
      humanLayer.x = 256;
      humanLayer.y = 340;
      humanLayer.scale = 0.82;

      characterLayer.x = 256;
      characterLayer.y = 135;
      characterLayer.scale = 0.42;
      break;

    case 'hugging':
      // Character clinging/hugging person
      humanLayer.x = 230;
      humanLayer.y = 290;
      humanLayer.scale = 0.85;

      characterLayer.x = 315;
      characterLayer.y = 260;
      characterLayer.scale = 0.50;
      characterLayer.rotation = -12;
      break;

    case 'fighting':
      // Playful battle / karate clash / sparring
      humanLayer.x = 180;
      humanLayer.y = 290;
      humanLayer.scale = 0.82;

      characterLayer.x = 340;
      characterLayer.y = 260;
      characterLayer.scale = 0.58;
      characterLayer.rotation = -18;
      break;

    case 'judging':
      // Side-by-side skeptical review
      humanLayer.x = 190;
      humanLayer.y = 290;
      humanLayer.scale = 0.80;

      characterLayer.x = 335;
      characterLayer.y = 290;
      characterLayer.scale = 0.55;
      break;

    case 'side_eye':
      // Both casting glances at each other
      humanLayer.x = 195;
      humanLayer.y = 290;
      humanLayer.scale = 0.82;

      characterLayer.x = 330;
      characterLayer.y = 285;
      characterLayer.scale = 0.56;
      characterLayer.rotation = 4;
      break;

    case 'riding':
      // Character scaled up as mount, person on top
      characterLayer.x = 256;
      characterLayer.y = 340;
      characterLayer.scale = 0.95;

      humanLayer.x = 256;
      humanLayer.y = 160;
      humanLayer.scale = 0.55;
      break;

    case 'photobomb':
      // Person centered normally, character popping into corner
      humanLayer.x = 256;
      humanLayer.y = 280;
      humanLayer.scale = 0.85;

      characterLayer.x = 410;
      characterLayer.y = 410;
      characterLayer.scale = 0.65;
      characterLayer.rotation = -35;
      break;

    case 'tiny_version':
      // Miniature companion perched on hand/arm
      humanLayer.x = 256;
      humanLayer.y = 290;
      humanLayer.scale = 0.88;

      characterLayer.x = 175;
      characterLayer.y = 300;
      characterLayer.scale = 0.25;
      break;

    default:
      humanLayer.x = 190;
      humanLayer.y = 290;
      humanLayer.scale = 0.8;

      characterLayer.x = 340;
      characterLayer.y = 290;
      characterLayer.scale = 0.6;
      break;
  }
}
