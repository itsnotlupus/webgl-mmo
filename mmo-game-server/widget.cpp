#include "widget.h"

#include <QHostAddress>
#include <QCryptographicHash>
#include <QString>

Widget::Widget(QWidget *parent)
    : QWidget(parent)
{
    startServerButton = new QPushButton(tr("Start server"), this);
    startServerButton->move(10, 10);
    connect( startServerButton, SIGNAL(clicked()), this, SLOT(startServerButtonClicked()));

    ptEdit = new QPlainTextEdit(this);
    ptEdit->move(10, 50);

    tcpServer = 0;

    cn = 0;


    port = 8001;
    tcpServer = new QTcpServer(this);
    bool ret = tcpServer->listen(QHostAddress::Any, port);
    if ( ret ) {
        ptEdit->appendPlainText(tr("QTcpServer is listening on port ") + QString::number(port));
    } else {
        ptEdit->appendPlainText(tr("QTcpServer failed to start listening!"));
        return;
    }
    connect(tcpServer, SIGNAL(newConnection()), this, SLOT(tcpServerNewConnection()));

}

Widget::~Widget()
{
    if ( tcpServer != 0 ) {
        tcpServer->close();
        delete tcpServer;
    }

}

void Widget::startServerButtonClicked()
{
//    qDebug("INFO: Widget::startServerButtonClicked - reporting");

    if ( tcpServer == 0 ) {
    } else {
        for ( int j = 0; j < cl.size(); j++ ) {
            cl.at(j)->sendMessage(QString("NAP 99,-2.0567248614539317,0,10.919584263326747,-0.15660000000000013").toUtf8());
            qDebug("message sending");
        }
    }

}


void Widget::tcpServerNewConnection()
{
//    qDebug("INFO: Widget::tcpServerNewConnection - reporting");

    Client *c = new Client(cn++, tcpServer->nextPendingConnection());
    connect(c, SIGNAL(handshaked(int)), this, SLOT(clientHandShaked(int)));
    connect(c, SIGNAL(gotMessage(int,QByteArray)), this, SLOT(clientGotMessage(int,QByteArray)));
    connect(c, SIGNAL(disconnected(int)), this, SLOT(clientDisconnected(int)));
    cl.append(c);

    ptEdit->appendPlainText(tr("QTcpServer new connection!"));

}


void Widget::clientGotMessage(int i, QByteArray ba) {
//    qDebug("client got message");
//    qDebug(ba);

    if ( ba.mid(0,4) == "MNP " ) {  // my new postition
        Client *c = 0;
        for ( int j = 0; j < cl.size(); j++ ) {
            if ( cl.at(j)->getN() == i ) {
                c = cl.at(j);
            }
        }
        if ( c == 0 ) {
            ptEdit->appendPlainText(tr("ERROR: Widget::clientGotMessage - client is not found!"));
            return;
        }
//        ptEdit->appendPlainText(tr("got MNP message"));
        QByteArray pos = ba.mid(4, ba.length()-4);
        QList<QByteArray> col = pos.split(',');
        c->px = QString(col.takeFirst()).toFloat();
        c->py = QString(col.takeFirst()).toFloat();
        c->pz = QString(col.takeFirst()).toFloat();
        c->pd = QString(col.takeFirst()).toFloat();

        QByteArray msg;
        msg.append("NAP ");
        msg.append(QString::number(i)).append(",");
        msg.append(pos);
        for ( int j = 0; j < cl.size(); j++ ) {
            if ( i == cl.at(j)->getN() ) continue;
            cl.at(j)->sendMessage(msg);
        }


    } else if ( ba.mid(0,4) == "MNS "  ) {
        Client *c = 0;
        for ( int j = 0; j < cl.size(); j++ ) {
            if ( cl.at(j)->getN() == i ) {
                c = cl.at(j);
            }
        }
        QByteArray skin = ba.mid(4, ba.length()-4);
        c->ps = skin.toInt();
        QByteArray msg;

        msg.append("ANS ");
        msg.append(QString::number(i)).append(",");
        msg.append(skin);
        for ( int j = 0; j < cl.size(); j++ ) {
            if ( i == cl.at(j)->getN() ) continue;
            cl.at(j)->sendMessage(msg);
        }

    } else {
        ptEdit->appendPlainText(tr("Got unknown code message: ") + ba);
    }

//    for ( int j = 0; j < cl.size(); j++ ) {
//        if ( i == cl.at(j)->getN() ) continue;
//        cl.at(j)->sendMessage(QString::number(i).append(" said:").append(ba).toUtf8());
//    }
//    qDebug("client got message finished");
}

void Widget::clientHandShaked(int i) {
    qDebug((QString("Client handshaked ") + QString::number(i)).toAscii());

    QByteArray msg;

    Client *c = 0;
    for ( int j = 0; j < cl.size(); j++ ) {
        if ( cl.at(j)->getN() == i ) {
            c = cl.at(j);
        }
    }

    // send new client everybodys else info;
    for ( int j = 0; j < cl.size(); j++ ) {
        Client *oc = cl.at(j);
        if ( oc->getN() == i ) continue;
        msg.clear();
        msg.append("NAP ");
        msg.append(QString::number(oc->getN())).append(",");
        msg.append(QString::number(oc->px)).append(",");
        msg.append(QString::number(oc->py)).append(",");
        msg.append(QString::number(oc->pz)).append(",");
        msg.append(QString::number(oc->pd));
        c->sendMessage(msg);

        msg.clear();
        msg.append("ANS ");
        msg.append(QString::number(oc->getN())).append(",");
        msg.append(QString::number(oc->ps));
        c->sendMessage(msg);
    }

    // send new cliend info to everyboy;
    msg.clear();
    msg.append("NAP ");
    msg.append(QString::number(c->getN())).append(",");
    msg.append(QString::number(c->px)).append(",");
    msg.append(QString::number(c->py)).append(",");
    msg.append(QString::number(c->pz)).append(",");
    msg.append(QString::number(c->pd));
    for ( int j = 0; j < cl.size(); j++ ) {
        Client *oc = cl.at(j);
        if ( oc == c ) continue;
        oc->sendMessage(msg);
    }

    msg.clear();
    msg.append("ANS ");
    msg.append(QString::number(c->getN())).append(",");
    msg.append(QString::number(c->ps));
    for ( int j = 0; j < cl.size(); j++ ) {
        Client *oc = cl.at(j);
        if ( oc == c ) continue;
        oc->sendMessage(msg);
    }

}

void Widget::clientDisconnected(int i) {
    qDebug((QString("Client disconnected ") + QString::number(i)).toAscii());
    for ( int j = 0; j < cl.size(); j++ ) {
        if ( cl.at(j)->getN() == i ) {
            delete cl.takeAt(j);
        }
    }
    for ( int j = 0; j < cl.size(); j++ ) {
        QByteArray msg;
        msg.append("ALR ");
        msg.append(QString::number(i));
        cl.at(j)->sendMessage(msg);
    }
}

