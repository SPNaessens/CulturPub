
 export const sendPushNotification = async (tokens,eventMessage, title, body) => {
    const message = {
      to: tokens,
      sound: 'default',
      title: eventMessage ,
      body,
    };
  
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
    }
  };