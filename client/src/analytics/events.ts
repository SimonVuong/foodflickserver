const events = {
    SIGNED_UP: 'Signed up',
    LOGGED_IN_WITH_PASSWORD: 'Logged in with password',
    LOGGED_IN_WITH_REFRESH: 'Logged in with refresh token',
    CLICKED_PLACE_ORDER: 'Clicked place order',
    CLICKED_SEARCH_BAR_ITEM: 'Clicked this item in the search bar',
    UPDATED_CARD: 'Updated Card',
    TOGGLED_MOBILE_DRAWER: 'Toggled mobile drawer',
    VISITED_PATH: (path: string): string => { return `Viewed ${path}` }
}

export default events;