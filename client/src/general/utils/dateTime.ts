import moment from 'moment';

export const displayDateTime = (epochMillis: number) => moment(epochMillis).format('M/D/YY h:mm a');