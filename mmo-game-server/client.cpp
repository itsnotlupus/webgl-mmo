#include "client.h"
#include "QCryptographicHash"

Client::Client(int n, QTcpSocket *s)
{
    this->n = n;
    this->s = s;

    connect(s, SIGNAL(readyRead()), this, SLOT(tcpSocketReadyRead()));
    connect(s, SIGNAL(disconnected()), this, SLOT(tcpSocketDisconnected()));

    timer = 0;

    px = py = pz = 0.0f;
    n = 0;
    ps = 1;
    lh = QTime::currentTime();

}


void Client::tcpSocketReadyRead() {

//    qDebug("INFO: Client::tcpSocketReadyRead - reporting");

    QByteArray message = s->readAll();

    if ( message.mid(0,4) == tr("GET ").toUtf8() ) {
//        qDebug("INFO: Client::tcpSocketReadyRead - new Handshake");
//        qDebug(message);
    } else {
//        qDebug("INFO: Client::tcpSocketReadyRead - not Handshake!");
//        qDebug(message);

        if ( message.at(0) == char(0) && message.at(message.size()-1) == char(255) ) {
//            qDebug("INFO: Client::tcpSocketReadyRead - new Message!");
            QByteArray ba = message.mid(1, message.size()-2);
            emit gotMessage(n, ba);
//            qDebug(text.toAscii());
        }

        return;
    }


    QByteArray origin;
    if ( message.contains("Origin:") ) {
        int p = message.indexOf("Origin: ");
        int d = message.indexOf("\r\n", p);
        origin = message.mid(p+8, d-p-8);
    }

    int k1, k2;
    k1 = message.indexOf("Sec-WebSocket-Key1:");
    k2 = message.indexOf("Sec-WebSocket-Key2:");

    if ( k1 != -1 || k2 != -1 ) {
//        qDebug("INFO: Client::tcpSocketReadyRead - keys found");
    } else {
        qDebug("ERROR: Client::tcpSocketReadyRead - Sec-WebSocket keys were not found!");
        return;
    }

    QString kt1, kt2;
    kt1 = message.mid(k1+20,message.indexOf("\n",k1+20)-k1-21);
    kt2 = message.mid(k2+20,message.indexOf("\n",k2+20)-k2-21);


    if ( !kt1.contains(" ") || !kt2.contains(" ") ) {
        qDebug("ERROR: Widget::tcpSocketReadyRead - Sec-WebSocket keys had no spaces!");
        return;
    }


    int s1 = 0, s2 = 0;
    unsigned int n1 = 0, n2 = 0;
    for ( int i = 0; i < kt1.length(); i++ ) {
        if ( kt1.at(i).isDigit() )
            n1 = n1*10 + kt1.at(i).digitValue();
        if ( kt1.at(i).isSpace() )
            s1++;
    }
    for ( int i = 0; i < kt2.length(); i++ ) {
        if ( kt2.at(i).isDigit() )
            n2 = n2*10 + kt2.at(i).digitValue();
        if ( kt2.at(i).isSpace() )
            s2++;
    }

    n1 = n1/s1;
    n2 = n2/s2;

    char challenge[16];
    memcpy(challenge, &n1, 4);
    memcpy(challenge+4, &n2, 4);

    char t;
    t = challenge[0]; challenge[0] = challenge[3]; challenge[3] = t;
    t = challenge[1]; challenge[1] = challenge[2]; challenge[2] = t;
    t = challenge[4]; challenge[4] = challenge[7]; challenge[7] = t;
    t = challenge[5]; challenge[5] = challenge[6]; challenge[6] = t;

    QString key_3 = message.mid(message.indexOf("\r\n\r\n")+4,8);

    for ( int i = 0; i < 8; i++ )
        challenge[8+i] = key_3.at(i).unicode();

    QCryptographicHash digest(QCryptographicHash::Md5);
    digest.addData(challenge, 16);

    QByteArray location;
    location.append("ws://");
    QByteArray host;
    if ( message.contains("Host:") ) {
        int p = message.indexOf("Host: ");
        int d = message.indexOf("\r\n", p);
        host = message.mid(p+6,d-p-6);
    }
    location.append(host);
    QByteArray resource_name = message.mid(4, message.indexOf(" ",4)-4);
    location.append(resource_name);


    QByteArray responce;
    responce += tr("HTTP/1.1 101 WebSocket Protocol Handshake\r\n");
    responce += tr("Upgrade: WebSocket\r\n");
    responce += tr("Connection: Upgrade\r\n");
    responce += tr("Sec-WebSocket-Origin: ") + origin + tr("\r\n");
    responce += tr("Sec-WebSocket-Location: ") + location + tr("\r\n");
//    responce += tr("Sec-WebSocket-Protocol: \r\n");

    responce += tr("\r\n");
    responce += digest.result();

//    qDebug("Handshake responce\n");
//    qDebug(responce);
//    qDebug(responce.toHex());

    s->write(responce);

    timer = new QTimer(this);
    connect( timer, SIGNAL(timeout()), this, SLOT(handshakeTimeOut()));
    timer->start(0);
}

void Client::handshakeTimeOut() {
    if ( timer != 0 ) timer->stop();
    emit handshaked(n);
}


void Client::tcpSocketDisconnected() {

    if ( timer != 0 ) timer->stop();
    emit disconnected(n);
}


void Client::sendMessage(QByteArray rawData) {
    QByteArray newMessage;
    newMessage.append(char(0));
    long long rawDataSize = rawData.size();
    char sizeBE[8];
    memcpy(sizeBE, &rawDataSize, 8);
    char t;
    t = sizeBE[0]; sizeBE[0] = sizeBE[7]; sizeBE[7] = t;
    t = sizeBE[1]; sizeBE[1] = sizeBE[6]; sizeBE[6] = t;
    t = sizeBE[2]; sizeBE[2] = sizeBE[5]; sizeBE[5] = t;
    t = sizeBE[3]; sizeBE[3] = sizeBE[4]; sizeBE[4] = t;

    newMessage.append(sizeBE,8);
    newMessage.append(rawData);
    newMessage.append(char(255));

    s->write(newMessage);
}

int Client::getN() {
    return n;
}
