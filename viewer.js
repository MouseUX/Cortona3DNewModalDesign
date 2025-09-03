(function (solo) {
    solo.baseUrl = 'res/';

    solo.use('skin', { baseUrl: 'uniview/src/' });

    const app = solo.skin.create('app');

    const interactivityFile = 'pump-catalog.interactivity.xml';
    app.use('solo-uniview', {
        baseUrl: 'uniview/src/',
        src: `./data/${interactivityFile}`,
        totalMemory: 64
    }).then(() => {
        console.log('✅ Model loaded');
    }).catch(err => {
        console.error('❌ Error loading model:', err);
    });

})(Cortona3DSolo);
