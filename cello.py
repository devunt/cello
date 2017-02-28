from flask import Flask
from flask import abort, flash, redirect, render_template, url_for
from flask import request, session

from flask_login import current_user, login_user

from login import login_manager
from models import db
from models import OAuthToken, User
from providers import oauth_providers, oauth_response_keys
from services import socketio


app = Flask(__name__)
app.config.from_object('settings.DevelopmentConfig')
db.init_app(app)
socketio.init_app(app)
login_manager.init_app(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/auth/<provider>')
def auth(provider):
    if provider in oauth_providers:
        callback = url_for('authorized', provider=provider,
                           next=request.args.get('next') or request.referrer or None, _external=True)
        return oauth_providers[provider].authorize(callback=callback)
    else:
        return abort(404)


@app.route('/auth/<provider>/authorized')
def authorized(provider):
    if provider in oauth_providers:
        resp = oauth_providers[provider].authorized_response()
        if resp is None:
            flash('Authorization failed.')
        else:
            raw_token = resp.get(oauth_response_keys[provider])
            session['oauth_token'] = raw_token

            token = OAuthToken.query.filter_by(provider=provider, token=raw_token).first()
            if token is None:
                user = current_user if current_user.is_authenticated else User()
                token = OAuthToken(provider=provider, token=raw_token, user=user)
                db.session.add(user)
                db.session.add(token)
                db.session.commit()
            else:
                user = token.user

            login_user(user, True)

        return redirect(request.args.get('next') or url_for('index'))
    else:
        return abort(404)


@app.route('/<name>')
def channel(name):
    return name


@app.before_first_request
def create_database():
    db.create_all()


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
