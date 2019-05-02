# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 10

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, pool1, pool2, wait_on_element

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


xpaths = {
    'navStorage': '//*[@id="nav-5"]/div/a[1]',
    'submenuPool': '//*[@id="5-0"]',
    'submenuDisks': '//*[@id="5-3"]',
    'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
    'deleteButton': '//*[contains(@name, "ok_button")]',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'poolID': '//mat-expansion-panel-header/span[2]',
    'poolDetach': "//button[@id='action_button_Export/Disconnect__name_",
    'pooldestroyCheckbox': '//*[@id="destroy"]/mat-checkbox/label/div',
    'poolconfirmCheckbox': '//*[@id="confirm"]/mat-checkbox/label/div',
    'confirmButton': '//div[3]/button[2]/span',
    'closeButton': '//div[2]/button/span',
    'pool1Table': f"//td[contains(.,'{pool1}')]",
    'pool2Table': f"//td[contains(.,'{pool2}')]"
}


def test_01_nav_store_pool(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['navStorage'], script_name, test_name)
    # Click Storage menu
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    # Click Pool submenu
    wb_driver.find_element_by_xpath(xpaths['submenuPool']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Pools" in page_data, page_data
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_02_looking_for_pool1(wb_driver):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['pool1Table']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, f'loading the new pool {pool1} timeout'
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_03_delete_pool1(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['poolID'], script_name, test_name)
    wb_driver.find_element_by_xpath(xpaths['poolID']).click()
    time.sleep(1)
    pool_detach(wb_driver, pool1, script_name, test_name)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_looking_for_pool2(wb_driver):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['pool2Table']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, f'loading the new pool {pool2} timeout'
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_05_delete_pool2(wb_driver):
    time.sleep(1)
    test_name = sys._getframe().f_code.co_name
    pool_detach(wb_driver, pool2, script_name, test_name)
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_06_close_navStorage(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def pool_detach(wb_driver, name, scriptname, testname):
    time.sleep(1)
    pool_xpath = f"//mat-icon[@id='table_actions_menu_button__name_{name}']"
    # Wait for xpath to be available
    wait_on_element(wb_driver, pool_xpath, scriptname, testname)
    wb_driver.find_element_by_xpath(pool_xpath).click()
    xpath = xpaths['poolDetach'] + name + "']/span"
    wb_driver.find_element_by_xpath(xpath).click()
    wb_driver.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    wb_driver.find_element_by_xpath(xpaths['poolconfirmCheckbox']).click()
    time.sleep(1)
    if wb_driver.find_element_by_xpath(xpaths['confirmButton']):
        wb_driver.find_element_by_xpath(xpaths['confirmButton']).click()
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['closeButton'], scriptname, testname)
    wb_driver.find_element_by_xpath(xpaths['closeButton']).click()
    time.sleep(1)
