Cello
=====

*Cello* is a websocket-based concurrent chat server built on top of *flask*.


Dependency
----------

* python >= 3.6.0
* see ``requirements.txt``


How to run
----------

.. code-block:: console

   $ git clone git://github.com/devunt/cello.git
   $ cd cello
   $ pip install -r requirements.txt
   $ FLASK_APP=cello.py flask run

Commands
--------

* ``/join #mychannel``: Join a channel named #mychannel.
* ``/part``: Leave a current channel.
* ``/nick mynickname``: Change a nickname.

Channel permalink
-----------------

A permalink to particular channel can be created by putting channel name at the end of the server address.

Note that without signing in, the link is always read-only.

For example: ``https://server.address/#mychannel``


Configrations
-------------

You have to specify your oauth consumer tokens in order to make it possible to users to login with other providers.

For more information, see ``settings.py`` file.


License
-------

See ``LICENSE`` file.