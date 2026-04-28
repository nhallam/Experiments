import type { Trail } from "../lib/types";

// Approximate PCT / JMT corridor southbound from Tuolumne Meadows through the
// Ritter Range to Devil's Postpile. Hand-traced waypoints — fine for a
// prototype; not survey-grade.
const path: [number, number][] = [
  [37.8775, -119.3437], // Tuolumne Meadows
  [37.8689, -119.3520],
  [37.8551, -119.3703], // Cathedral Pass area
  [37.8467, -119.4055], // Cathedral Peak shoulder
  [37.8358, -119.3770],
  [37.8200, -119.3400],
  [37.8050, -119.3050], // Lyell Canyon
  [37.7920, -119.2780],
  [37.7847, -119.2547], // Donohue Pass
  [37.7700, -119.2350],
  [37.7500, -119.2050], // Marie Lakes
  [37.7350, -119.1830],
  [37.7268, -119.1683], // Thousand Island Lake
  [37.7220, -119.1750],
  [37.7193, -119.1817], // Garnet Lake
  [37.7050, -119.1500],
  [37.6800, -119.1200],
  [37.6500, -119.0950],
  [37.6253, -119.0853], // Devil's Postpile
];

export const trail: Trail = {
  id: "pct-sierra",
  name: "PCT — Sierra: Tuolumne to Devil's Postpile",
  description:
    "About 38 miles of the Pacific Crest Trail (overlapping the John Muir Trail) from Tuolumne Meadows over Donohue Pass and through the Ritter Range to Devil's Postpile.",
  path,
  pois: [
    {
      id: "cathedral-peak",
      name: "Cathedral Peak",
      coord: [37.8467, -119.4055],
      blurb:
        "John Muir made the first recorded ascent of Cathedral Peak in September 1869, alone and without rope.",
      artworks: [
        {
          kind: "text",
          title: "From My First Summer in the Sierra",
          author: "John Muir",
          year: 1911,
          excerpt:
            "This I may say is the first time I have been at church in California, led here at last, every door graciously opened for the poor lonely worshiper. In our best times everything turns into religion, all the world seems a church and the mountains altars.",
          source: "Public domain (US)",
        },
        {
          kind: "image",
          title: "Cathedral Peak and Lake, Yosemite National Park",
          author: "Ansel Adams",
          year: 1942,
          imageUrl:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cathedral_Peak_and_Lake%2C_Yosemite_National_Park%2C_California.jpg/800px-Cathedral_Peak_and_Lake%2C_Yosemite_National_Park%2C_California.jpg",
          source:
            "Ansel Adams, National Archives — Mural Project (public domain)",
        },
      ],
    },
    {
      id: "lyell-canyon",
      name: "Lyell Canyon & Mount Lyell",
      coord: [37.8050, -119.3050],
      blurb:
        "The headwaters of the Tuolumne River run through Lyell Canyon below Yosemite's highest peak, where Muir documented active glaciers in 1872.",
      artworks: [
        {
          kind: "text",
          title: "From The Mountains of California — 'Living Glaciers of California'",
          author: "John Muir",
          year: 1894,
          excerpt:
            "I discovered the Mount Lyell Glacier in October, 1871. It lies between the summit and a crescent of lofty peaks, in a shadowy amphitheater that fronts the north. The ice is from 250 to 500 feet thick, finely seamed and ridged.",
          source: "Public domain (US)",
        },
      ],
    },
    {
      id: "donohue-pass",
      name: "Donohue Pass",
      coord: [37.7847, -119.2547],
      blurb:
        "11,073 ft — the southern boundary of Yosemite National Park and the gateway to the Ansel Adams Wilderness.",
      artworks: [
        {
          kind: "image",
          title: "Among the Sierra Nevada, California",
          author: "Albert Bierstadt",
          year: 1868,
          imageUrl:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Albert_Bierstadt_-_Among_the_Sierra_Nevada%2C_California_-_Google_Art_Project.jpg/1024px-Albert_Bierstadt_-_Among_the_Sierra_Nevada%2C_California_-_Google_Art_Project.jpg",
          source: "Smithsonian American Art Museum (public domain)",
        },
      ],
    },
    {
      id: "thousand-island-lake",
      name: "Thousand Island Lake & Banner Peak",
      coord: [37.7268, -119.1683],
      blurb:
        "One of the most photographed views in the Sierra. Banner Peak rises 12,943 ft over a lake studded with granite islets.",
      artworks: [
        {
          kind: "image",
          title: "Banner Peak and Thousand Island Lake",
          author: "Ansel Adams",
          year: 1923,
          imageUrl:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Banner_Peak_and_Thousand_Island_Lake.jpg/1024px-Banner_Peak_and_Thousand_Island_Lake.jpg",
          source: "Wikimedia Commons",
        },
        {
          kind: "text",
          title: "Field note",
          author: "Theodore Solomons",
          year: 1895,
          excerpt:
            "A more imposing scene of mountain magnificence I had never beheld — a thousand islets, the lake stretching like a deep blue floor at the foot of Banner.",
          source: "Public domain (US)",
        },
      ],
    },
    {
      id: "mount-ritter",
      name: "Mount Ritter",
      coord: [37.6917, -119.1981],
      blurb:
        "13,143 ft. Muir's near-fatal solo climb in October 1872 produced one of the most famous passages in American mountain literature.",
      artworks: [
        {
          kind: "text",
          title: "From The Mountains of California — 'A Near View of the High Sierra'",
          author: "John Muir",
          year: 1894,
          excerpt:
            "After gaining a point about half-way to the top, I was suddenly brought to a dead stop, with arms outspread, clinging close to the face of the rock, unable to move hand or foot either up or down. My doom appeared fixed. I MUST fall. There would be a moment of bewilderment, and then a lifeless rumble down the cliff to the glacier below. … Then my trembling muscles became firm again, every rift and flaw in the rock was seen as through a microscope, and my limbs moved with a positiveness and precision with which I seemed to have nothing at all to do.",
          source: "Public domain (US)",
        },
      ],
    },
    {
      id: "devils-postpile",
      name: "Devil's Postpile",
      coord: [37.6253, -119.0853],
      blurb:
        "A 60-foot wall of hexagonal basalt columns, formed when a lava flow cooled slowly under uniform pressure roughly 100,000 years ago.",
      artworks: [
        {
          kind: "image",
          title: "Devils Postpile National Monument",
          author: "Ansel Adams",
          year: 1941,
          imageUrl:
            "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Devils_Postpile_National_Monument%2C_California_-_NARA_-_519896.jpg/800px-Devils_Postpile_National_Monument%2C_California_-_NARA_-_519896.jpg",
          source:
            "Ansel Adams, National Archives — Mural Project (public domain)",
        },
      ],
    },
  ],
};
