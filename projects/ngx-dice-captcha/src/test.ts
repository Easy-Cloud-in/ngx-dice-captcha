// This file is required by karma.conf.js and loads recursively all the .spec and framework files
// Angular 20 Zoneless Testing Setup

import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Initialize Angular testing environment for zoneless applications
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
  teardown: { destroyAfterEach: true },
});
