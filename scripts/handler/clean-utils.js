// 2021-08-26T05:41:14+00:00
// 26.08.2021 07:41 = GMT+2
const getHRDate = (dateStr) => {
    const now = !!dateStr ? new Date(dateStr) : new Date();
    const year = now.getFullYear();
    const month = ((now.getMonth() + 1) + '').padStart(2, '00');
    const day = ((now.getDate()) + '').padStart(2, '00');
    const hour = ((now.getHours()) + '').padStart(2, '00');
    const minute = ((now.getMinutes()) + '').padStart(2, '00');
    return `${day}.${month}.${year} ${hour}:${minute}`;
}

const isDST = (d) => {
    let jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
    let jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
    return Math.max(jan, jul) !== d.getTimezoneOffset();
}

// 26.08.2021 07:41
// 2021-08-26T07:41:00+02:00
const getDateTime = (hrDate) => {
    const isSummertime = isDST(new Date());
    const date = hrDate.split(' ');
    const dmy = date[0].split('.');
    return `${dmy[2]}-${dmy[1]}-${dmy[0]}T${date[1] || '00:00'}:00+0${!isSummertime ? 2 : 1}:00`;
}

export {
    getHRDate,
    isDST,
    getDateTime,
}
