export type LatLng = [number, number];

export type Artwork =
  | {
      kind: "image";
      title: string;
      author: string;
      year?: number;
      imageUrl: string;
      source: string;
    }
  | {
      kind: "text";
      title: string;
      author: string;
      year?: number;
      excerpt: string;
      source: string;
    };

export type POI = {
  id: string;
  name: string;
  coord: LatLng;
  blurb: string;
  artworks: Artwork[];
};

export type Trail = {
  id: string;
  name: string;
  description: string;
  path: LatLng[];
  pois: POI[];
};
