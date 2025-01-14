// src/PushNotification.js
import React, { useState } from 'react';

const PushNotification = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const unsubscribe = async() => {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
    
        if (subscription) {
          const response = await fetch('http://localhost:5003/unsubscribe', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              endpoint: subscription.endpoint 
            })
          });
    
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
    
          // Unsubscribe from push notifications locally
          await subscription.unsubscribe(); 
          alert('Unsubscribed from push notifications');
          console.log('Successfully unsubscribed from push notifications');
          // Update UI or inform the user of successful unsubscription
        } else {
          console.log('No existing push subscription found.');
        }
      } catch (error) {
        console.error('Error while unsubscribing:', error);
        // Handle the error (e.g., display an error message to the user)
      }
  }

  const subscribeToPush = async () => {
    try {
      const serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(process.env.VAPID_PUBLIC_KEY), // Use your VAPID public key
      });
      

      let p256dh, auth;
      try {
        p256dh = new Uint8Array(await subscription.getKey('p256dh'));
        auth = new Uint8Array(await subscription.getKey('auth'));
      } catch (error) {
        console.error('Error getting keys:', error); 
        // Handle the error gracefully
      }


    //   Send subscription to the backend to store it in the database
      const response = await fetch('http://localhost:5003/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: Array.from(p256dh),
            auth: Array.from(auth)
          },
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        console.log('Subscribed to push notifications!');
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  return (
    <div>
      {!isSubscribed ? (
        <button onClick={subscribeToPush}>Subscribe to Notifications</button>
      ) : (
        <p>Subscribed to Push Notifications!</p>
      )}
       <button onClick={unsubscribe}>UNSubscribe to Notifications</button>
    </div>
  );
};

// Utility to convert VAPID public key
function urlB64ToUint8Array(base64String) {
    console.log(base64String?.length ?? -1);
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default PushNotification;
