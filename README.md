# [Gla Frontend](https://mistydao.com/)
This is the front-end repo for Gla that allows users be part of the future of Greece. 

##  🔧 Setting up Local Development

Required: 
- [Node v14](https://nodejs.org/download/release/latest-v14.x/)  
- [Yarn](https://classic.yarnpkg.com/en/docs/install/) 
- [Git](https://git-scm.com/downloads)


```bash
$ git clone https://github.com/Misty-DAO/MistyDAO.git
$ cd galacticdao

# set up your environment variables
# read the comments in the .env files for what is required/optional
$ cp .env.example .env

# fill in your own values in .env, then =>
$ yarn
$ yarn start
```

The site is now running at `http://localhost:3000`!
Open the source code and start editing!

### Architecture/Layout
The app is written in [React](https://reactjs.org/) using [Redux](https://redux.js.org/) as the state container. 

The files/folder structure are a  **WIP** and may contain some unused files. The project is rapidly evolving so please update this section if you see it is inaccurate!

```
./src/
├── App.jsx       // Main app page
├── abi/          // Contract ABIs from etherscan.io
├── actions/      // Redux actions 
├── assets/       // Static assets (SVGs)
├── components/   // Reusable individual components
├── constants.js/ // Mainnet Addresses & common ABI
├── contracts/    // TODO: The contracts be here as submodules
├── helpers/      // Helper methods to use in the app
├── hooks/        // Shared reactHooks
├── themes/       // Style sheets for dark vs light theme
└── views/        // Individual Views
```

## 🗣 Community

* [Join our Discord](https://discord.me/gla) and ask how you can get involved with the DAO!

