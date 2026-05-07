export interface Drawing {
  id: string
  name: string
  svgPath: string
}

export interface ColorAction {
  pathId: string
  previousColor: string
  newColor: string
}
