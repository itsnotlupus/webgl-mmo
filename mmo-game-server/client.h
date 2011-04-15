#ifndef CLIENT_H
#define CLIENT_H

#include <QObject>
#include <QTcpSocket>
#include <QTimer>
#include <QTime>

class Client : public QObject
{
    Q_OBJECT
public:
    Client(int n, QTcpSocket *s);

    void sendMessage(QByteArray ba);
    int getN();

    float px, py, pz, pd;
    int n, ps;
    QTime lh;

signals:

    void handshaked(int i);
    void disconnected(int i);
    void gotMessage(int i, QByteArray ba);

private slots:

    void tcpSocketReadyRead();
    void tcpSocketDisconnected();
    void handshakeTimeOut();

private:
    QTcpSocket *s;
    QTimer *timer;

};

#endif // CLIENT_H
