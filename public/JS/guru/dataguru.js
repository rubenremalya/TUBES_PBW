function showHide() {
    let travelhistory = document.getElementById('travel')
    if (travelhistory.value == 1) {
        document.getElementById('hidden-panel').style.display = 'block'
    } else if (travelhistory.value == 2) {
        document.getElementById('hidden-panel2').style.display = 'block'
    } else {
        document.getElementById('hidden-panel').style.display = 'none'
    }
}