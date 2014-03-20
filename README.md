#Copyright Notice

VERN is copyright 2014 uh-sem-blee, Co. Built by typefoo.

#License

You may not use, alter, or redistribute this code without permission from uh-sem-blee, Co.

# VERN Core

The VERN core is a new methodology for building website. The central idea behind VERN is processing distribution. Processing is performed client-side whenever possible, thus reducing the load on servers enabling them to scale further. Most websites today rely on some kind of application layer to serve content. These layers perform parsing which is extremely taxing and results in the need for caching and other solutions. VERN solves this problem.

The only issue this presents is for SEO in web applications. If your project needs SEO, utilize the SEO manager built into VERN's admin panel.

## Install

For the library

`npm install vern-core`

For the CLI tool

`npm install -g vern-core`

## Contributing

Contributing to vern-core can be done via your own forked repository

1. [Fork the repo](https://github.com/uh-sem-blee/vern-core/fork)
2. Clone the repo to your local machine

```
git clone <your-forked-repo-url>
```

3. Add the master source to your remote list for pulling updates easily

```
git remote add core git@github.com:uh-sem-blee/vern-core.git
```

4. When you need to update perform a `git pull core master`
5. Create issues with the following formats:

```
[feature] _component_name_ _short_description_
[documentation] _component_name_ _sub_component_name_
[bug] _component_name_ _short_description_
```

6. When committing ensure your messages correspond with your issue. This practice ensures commits are made with relevant information and can easily be tracked.

```
git commit -m "#_issue_number_ _component_name_ _description_of_commit_"
```

7. Once you believe your issue is resolved, perform a pull request from your forked repo page.
8. We will review your request and integrate the necessary pieces into core.

## Usage

You will use VERN inside your server to create routes, controllers, and models.

[EXAMPLE]

You will use VERN inside your client to create views which connect to your API server.

[EXAMPLE]