const _TotalTips = `
  type TotalTips {
    servers: [OrderUserRef!]!
    tips: [Float!]!
  }
`
export const TotalTips = () => [_TotalTips]
