

export async function log(message:string) {
    await fetch("http://127.0.0.1:7000/log", {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        'log': message
        })
    }).then((response) => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    }).catch((error) => {
        console.error('send log failed:', error);
    });

}