var APP_DATA = {
  "scenes": [
    {
      "id": "0-lobby-entrance",
      "name": "Lobby Entrance",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "yaw": 0.17144626362003557,
        "pitch": 0.18809088542896646,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -0.6520110630331484,
          "pitch": 0.21809118093473145,
          "rotation": 0,
          "target": "5-conference-room-1"
        },
        {
          "yaw": -0.18557584658403847,
          "pitch": 0.07474004392971167,
          "rotation": 0,
          "target": "6-av-room"
        },
        {
          "yaw": 1.090574412339702,
          "pitch": 0.09846814869657727,
          "rotation": 0,
          "target": "3-infant-nursery-and-bathrooms"
        },
        {
          "yaw": 0.2065776970757618,
          "pitch": 0.07827558328279238,
          "rotation": 0,
          "target": "1-lobby-center"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "1-lobby-center",
      "name": "Lobby Center",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -2.2645495425350326,
          "pitch": 0.12485752564618835,
          "rotation": 0,
          "target": "0-lobby-entrance"
        },
        {
          "yaw": -0.61071372505101,
          "pitch": 0.15371409844024342,
          "rotation": 0,
          "target": "6-av-room"
        },
        {
          "yaw": 2.6963001608390407,
          "pitch": 0.18589460507998545,
          "rotation": 0,
          "target": "3-infant-nursery-and-bathrooms"
        },
        {
          "yaw": 0.9052642906194492,
          "pitch": 0.0994091128838086,
          "rotation": 0,
          "target": "2-lobby-portico"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "2-lobby-portico",
      "name": "Lobby Portico",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -1.632185830337047,
          "pitch": 0.15505549827814136,
          "rotation": 0,
          "target": "4-toddler-nursery"
        },
        {
          "yaw": -0.7418742246428209,
          "pitch": 0.12173098604141508,
          "rotation": 0,
          "target": "1-lobby-center"
        },
        {
          "yaw": -0.1236780268201585,
          "pitch": 0.17445611362953173,
          "rotation": 0,
          "target": "7-conference-room-2"
        },
        {
          "yaw": 1.6918778145140392,
          "pitch": 0.1495649808985604,
          "rotation": 0,
          "target": "10-classroom-1"
        },
        {
          "yaw": 1.0284615370315464,
          "pitch": 0.14320390272033023,
          "rotation": 0,
          "target": "11-classroom-2"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "3-infant-nursery-and-bathrooms",
      "name": "Infant Nursery and Bathrooms",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 1.5256169272906552,
          "pitch": 0.06967852558588916,
          "rotation": 0,
          "target": "0-lobby-entrance"
        },
        {
          "yaw": 2.802520373432362,
          "pitch": 0.06968021372145117,
          "rotation": 0,
          "target": "1-lobby-center"
        },
        {
          "yaw": -2.465521967914242,
          "pitch": 0.12092651280839029,
          "rotation": 0,
          "target": "4-toddler-nursery"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "4-toddler-nursery",
      "name": "Toddler Nursery",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -0.3174280740203521,
          "pitch": 0.16719268252169783,
          "rotation": 0,
          "target": "3-infant-nursery-and-bathrooms"
        },
        {
          "yaw": 2.124704400336369,
          "pitch": 0.13170806796461143,
          "rotation": 0,
          "target": "2-lobby-portico"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "5-conference-room-1",
      "name": "Conference Room 1",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 1.1949475932530351,
          "pitch": 0.11171041231569845,
          "rotation": 0,
          "target": "9-auditorium-center"
        },
        {
          "yaw": 2.2311361825241445,
          "pitch": 0.11556754651123669,
          "rotation": 0,
          "target": "6-av-room"
        },
        {
          "yaw": 3.135042349501113,
          "pitch": 0.26967954553782825,
          "rotation": 0,
          "target": "0-lobby-entrance"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "6-av-room",
      "name": "AV Room",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 3.1014734280342475,
          "pitch": 0.2069128292359217,
          "rotation": 0,
          "target": "1-lobby-center"
        },
        {
          "yaw": -2.184099952769744,
          "pitch": 0.13400051417109893,
          "rotation": 0,
          "target": "0-lobby-entrance"
        },
        {
          "yaw": 2.0572952897163708,
          "pitch": 0.15023201149755572,
          "rotation": 0,
          "target": "2-lobby-portico"
        },
        {
          "yaw": 1.458665609457361,
          "pitch": 0.16600934891785357,
          "rotation": 0,
          "target": "7-conference-room-2"
        },
        {
          "yaw": -0.26417495627318743,
          "pitch": 0.4257997598060541,
          "rotation": 0,
          "target": "9-auditorium-center"
        },
        {
          "yaw": -0.04439992598287468,
          "pitch": -0.008122497021204822,
          "rotation": 0,
          "target": "8-auditorium-stage"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "7-conference-room-2",
      "name": "Conference Room 2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 2.1383425661829554,
          "pitch": 0.25544518348684697,
          "rotation": 0,
          "target": "2-lobby-portico"
        },
        {
          "yaw": -0.1754168965862739,
          "pitch": 0.05995240453429673,
          "rotation": 0,
          "target": "10-classroom-1"
        },
        {
          "yaw": -2.2785413453059196,
          "pitch": 0.1343092567969837,
          "rotation": 0,
          "target": "9-auditorium-center"
        },
        {
          "yaw": -0.8188646085940601,
          "pitch": 0.09377250406313742,
          "rotation": 0,
          "target": "11-classroom-2"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "8-auditorium-stage",
      "name": "Auditorium Stage",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "yaw": -0.838268386543028,
        "pitch": 0.17898644814421516,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -0.8348212291072503,
          "pitch": 0.3324232618333891,
          "rotation": 0,
          "target": "9-auditorium-center"
        },
        {
          "yaw": -2.486798682955465,
          "pitch": 0.050760716750192,
          "rotation": 0,
          "target": "12-classroom-3"
        },
        {
          "yaw": -1.9868267952097334,
          "pitch": 0.05482569834730633,
          "rotation": 0,
          "target": "11-classroom-2"
        },
        {
          "yaw": -1.605239558705632,
          "pitch": 0.06812230032992161,
          "rotation": 0,
          "target": "10-classroom-1"
        },
        {
          "yaw": -0.8758609201722241,
          "pitch": -0.05216949978877139,
          "rotation": 0,
          "target": "6-av-room"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "9-auditorium-center",
      "name": "Auditorium Center",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -0.7114910999519193,
          "pitch": 0.06111740321178871,
          "rotation": 0,
          "target": "8-auditorium-stage"
        },
        {
          "yaw": 0.2517032275059634,
          "pitch": -0.006738106157694546,
          "rotation": 0,
          "target": "12-classroom-3"
        },
        {
          "yaw": 0.7214159146207955,
          "pitch": -0.004396038175196182,
          "rotation": 0,
          "target": "11-classroom-2"
        },
        {
          "yaw": 1.2341058551144108,
          "pitch": -0.004357370853171005,
          "rotation": 0,
          "target": "10-classroom-1"
        },
        {
          "yaw": 1.6760026672671406,
          "pitch": 0.006898936166084724,
          "rotation": 0,
          "target": "7-conference-room-2"
        },
        {
          "yaw": 2.433388405468466,
          "pitch": 0.025201102254920116,
          "rotation": 0,
          "target": "6-av-room"
        },
        {
          "yaw": -3.0577716792380656,
          "pitch": 0.009997994354673523,
          "rotation": 0,
          "target": "5-conference-room-1"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "10-classroom-1",
      "name": "Classroom 1",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -1.2003046339296866,
          "pitch": 0.1914832068069412,
          "rotation": 0,
          "target": "11-classroom-2"
        },
        {
          "yaw": 2.213640118455385,
          "pitch": 0.2058020792172428,
          "rotation": 0,
          "target": "2-lobby-portico"
        },
        {
          "yaw": -2.7755007529626408,
          "pitch": 0.20530609246038267,
          "rotation": 0,
          "target": "7-conference-room-2"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "11-classroom-2",
      "name": "Classroom 2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -2.952234848890253,
          "pitch": 0.1140763867163237,
          "rotation": 0,
          "target": "10-classroom-1"
        },
        {
          "yaw": -1.0085198869412597,
          "pitch": 0.07865582658918768,
          "rotation": 0,
          "target": "9-auditorium-center"
        },
        {
          "yaw": 0.1928232708775912,
          "pitch": 0.15760876632047172,
          "rotation": 0,
          "target": "12-classroom-3"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "12-classroom-3",
      "name": "Classroom 3",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -0.7861326218313582,
          "pitch": 0.1314546440336315,
          "rotation": 0,
          "target": "11-classroom-2"
        },
        {
          "yaw": 0.6224986799994934,
          "pitch": 0.06972959480324548,
          "rotation": 0,
          "target": "9-auditorium-center"
        },
        {
          "yaw": 1.3751276793666953,
          "pitch": 0.06677347605624817,
          "rotation": 0,
          "target": "8-auditorium-stage"
        }
      ],
      "infoHotspots": []
    }
  ],
  "name": "Project Title",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": true,
    "fullscreenButton": true,
    "viewControlButtons": true
  }
};
